import OpenAI from 'openai'
import type { AIProvider, ChatParams, ChatResponse, ChatMessage, StreamEvent, ModelInfo, ToolCall } from './types'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  private mapMessages(messages: ChatMessage[], systemPrompt: string): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant') {
        const assistantMsg: OpenAI.ChatCompletionAssistantMessageParam = {
          role: 'assistant',
          content: msg.content || null,
        }
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          assistantMsg.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.input) },
          }))
        }
        result.push(assistantMsg)
      } else if (msg.role === 'tool_result') {
        result.push({
          role: 'tool',
          tool_call_id: msg.toolCallId!,
          content: msg.content,
        })
      }
    }

    return result
  }

  private mapTools(tools?: import('./types').ToolDefinition[]): OpenAI.ChatCompletionTool[] | undefined {
    if (!tools || tools.length === 0) return undefined
    return tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }))
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens || 4096,
      messages: this.mapMessages(params.messages, params.systemPrompt),
      tools: this.mapTools(params.tools),
      temperature: params.temperature,
    })

    const choice = response.choices[0]
    const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments || '{}'),
    }))

    return {
      content: choice.message.content || '',
      toolCalls,
      stopReason: choice.finish_reason || 'stop',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    }
  }

  async *chatStream(params: ChatParams): AsyncIterable<StreamEvent> {
    const stream = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens || 4096,
      messages: this.mapMessages(params.messages, params.systemPrompt),
      tools: this.mapTools(params.tools),
      temperature: params.temperature,
      stream: true,
      stream_options: { include_usage: true },
    })

    const toolCallBuffers = new Map<number, { id: string; name: string; args: string }>()

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta

      if (delta?.content) {
        yield { type: 'text_delta', content: delta.content }
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallBuffers.has(tc.index)) {
            toolCallBuffers.set(tc.index, { id: tc.id || '', name: tc.function?.name || '', args: '' })
          }
          const buf = toolCallBuffers.get(tc.index)!
          if (tc.id) buf.id = tc.id
          if (tc.function?.name) buf.name = tc.function.name
          if (tc.function?.arguments) buf.args += tc.function.arguments
        }
      }

      const finishReason = chunk.choices?.[0]?.finish_reason
      if (finishReason) {
        for (const [, buf] of toolCallBuffers) {
          let input: Record<string, unknown> = {}
          try { input = JSON.parse(buf.args) } catch {}
          yield { type: 'tool_call', id: buf.id, name: buf.name, input }
        }
        toolCallBuffers.clear()

        const stopReason = finishReason === 'tool_calls' ? 'tool_use' : finishReason === 'stop' ? 'end_turn' : 'max_tokens'
        yield { type: 'stop', stopReason: stopReason as any }
      }

      if (chunk.usage) {
        yield {
          type: 'usage',
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0,
        }
      }
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  listModels(): ModelInfo[] {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 128000,
        supportsTools: true,
        costPerInputToken: 0.0000025,
        costPerOutputToken: 0.00001,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        maxTokens: 128000,
        supportsTools: true,
        costPerInputToken: 0.00000015,
        costPerOutputToken: 0.0000006,
      },
      {
        id: 'o3-mini',
        name: 'o3-mini',
        maxTokens: 200000,
        supportsTools: true,
        costPerInputToken: 0.0000011,
        costPerOutputToken: 0.0000044,
      },
    ]
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey })
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      })
      return true
    } catch {
      return false
    }
  }
}
