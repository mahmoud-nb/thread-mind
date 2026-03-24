import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ChatParams, ChatResponse, ChatMessage, StreamEvent, ModelInfo, ToolCall } from './types'

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  private mapMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = []

    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          const content: Anthropic.ContentBlockParam[] = []
          if (msg.content) {
            content.push({ type: 'text', text: msg.content })
          }
          for (const tc of msg.toolCalls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })
          }
          result.push({ role: 'assistant', content })
        } else {
          result.push({ role: 'assistant', content: msg.content })
        }
      } else if (msg.role === 'tool_result') {
        result.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: msg.toolCallId!,
            content: msg.content,
          }],
        })
      }
    }

    return result
  }

  private mapTools(tools?: import('./types').ToolDefinition[]): Anthropic.Tool[] | undefined {
    if (!tools || tools.length === 0) return undefined
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }))
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens || 4096,
      system: params.systemPrompt,
      messages: this.mapMessages(params.messages),
      tools: this.mapTools(params.tools),
      temperature: params.temperature,
    })

    let content = ''
    const toolCalls: ToolCall[] = []

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })
      }
    }

    return {
      content,
      toolCalls,
      stopReason: response.stop_reason || 'end_turn',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    }
  }

  async *chatStream(params: ChatParams): AsyncIterable<StreamEvent> {
    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens || 4096,
      system: params.systemPrompt,
      messages: this.mapMessages(params.messages),
      tools: this.mapTools(params.tools),
      temperature: params.temperature,
    })

    let currentToolCall: { id: string; name: string; inputJson: string } | null = null

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block.type === 'tool_use') {
          currentToolCall = { id: block.id, name: block.name, inputJson: '' }
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (delta.type === 'text_delta') {
          yield { type: 'text_delta', content: delta.text }
        } else if (delta.type === 'input_json_delta' && currentToolCall) {
          currentToolCall.inputJson += delta.partial_json
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolCall) {
          let input: Record<string, unknown> = {}
          try {
            input = JSON.parse(currentToolCall.inputJson)
          } catch {}
          yield {
            type: 'tool_call',
            id: currentToolCall.id,
            name: currentToolCall.name,
            input,
          }
          currentToolCall = null
        }
      } else if (event.type === 'message_delta') {
        const stopReason = (event as any).delta?.stop_reason
        if (stopReason) {
          yield { type: 'stop', stopReason }
        }
      } else if (event.type === 'message_start') {
        const usage = (event as any).message?.usage
        if (usage) {
          yield {
            type: 'usage',
            inputTokens: usage.input_tokens || 0,
            outputTokens: usage.output_tokens || 0,
          }
        }
      }
    }

    const finalMessage = await stream.finalMessage()
    yield {
      type: 'usage',
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    }
  }

  estimateTokens(text: string): number {
    // Approximation: ~4 characters per token for English
    return Math.ceil(text.length / 4)
  }

  listModels(): ModelInfo[] {
    return [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        maxTokens: 200000,
        supportsTools: true,
        costPerInputToken: 0.000003,
        costPerOutputToken: 0.000015,
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        maxTokens: 200000,
        supportsTools: true,
        costPerInputToken: 0.0000008,
        costPerOutputToken: 0.000004,
      },
      {
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        maxTokens: 200000,
        supportsTools: true,
        costPerInputToken: 0.000015,
        costPerOutputToken: 0.000075,
      },
    ]
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new Anthropic({ apiKey })
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      })
      return true
    } catch {
      return false
    }
  }
}
