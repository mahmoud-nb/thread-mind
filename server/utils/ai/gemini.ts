import { GoogleGenAI, type Content, type Tool, type Part } from '@google/genai'
import type { AIProvider, ChatParams, ChatResponse, ChatMessage, StreamEvent, ModelInfo, ToolCall } from './types'
import { getProviderDef } from './model-registry'

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const
  private client: GoogleGenAI

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  private mapMessages(messages: ChatMessage[]): Content[] {
    const result: Content[] = []

    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', parts: [{ text: msg.content }] })
      } else if (msg.role === 'assistant') {
        const parts: Part[] = []
        if (msg.content) {
          parts.push({ text: msg.content })
        }
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: { name: tc.name, args: tc.input },
            })
          }
        }
        result.push({ role: 'model', parts })
      } else if (msg.role === 'tool_result') {
        result.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.toolCallId || 'unknown',
              response: { result: msg.content },
            },
          }],
        })
      }
    }

    return result
  }

  private mapTools(tools?: import('./types').ToolDefinition[]): Tool[] | undefined {
    if (!tools || tools.length === 0) return undefined
    return [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: this.cleanSchemaForGemini(t.inputSchema),
      })),
    }]
  }

  /**
   * Gemini is strict about JSON Schema:
   * - No `additionalProperties`
   * - `type` must be uppercase (STRING, NUMBER, BOOLEAN, OBJECT, ARRAY)
   * - Properties must match Gemini's subset
   */
  private cleanSchemaForGemini(schema: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(schema)) {
      if (key === 'additionalProperties') continue // Gemini doesn't support this

      if (key === 'properties' && typeof value === 'object' && value !== null) {
        const props: Record<string, unknown> = {}
        for (const [propName, propVal] of Object.entries(value as Record<string, unknown>)) {
          props[propName] = this.cleanSchemaForGemini(propVal as Record<string, unknown>)
        }
        cleaned[key] = props
      } else {
        cleaned[key] = value
      }
    }

    return cleaned
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.models.generateContent({
      model: params.model,
      contents: this.mapMessages(params.messages),
      config: {
        maxOutputTokens: params.maxTokens || 4096,
        temperature: params.temperature,
        systemInstruction: params.systemPrompt,
        tools: this.mapTools(params.tools),
      },
    })

    let content = ''
    const toolCalls: ToolCall[] = []

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) content += part.text
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: part.functionCall.name!,
            input: (part.functionCall.args || {}) as Record<string, unknown>,
          })
        }
      }
    }

    return {
      content,
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    }
  }

  async *chatStream(params: ChatParams): AsyncIterable<StreamEvent> {
    const response = await this.client.models.generateContentStream({
      model: params.model,
      contents: this.mapMessages(params.messages),
      config: {
        maxOutputTokens: params.maxTokens || 4096,
        temperature: params.temperature,
        systemInstruction: params.systemPrompt,
        tools: this.mapTools(params.tools),
      },
    })

    let totalInput = 0
    let totalOutput = 0
    let hasToolCalls = false

    for await (const chunk of response) {
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.text) {
            yield { type: 'text_delta', content: part.text }
          }
          if (part.functionCall) {
            hasToolCalls = true
            yield {
              type: 'tool_call',
              id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: part.functionCall.name!,
              input: (part.functionCall.args || {}) as Record<string, unknown>,
            }
          }
        }
      }

      if (chunk.usageMetadata) {
        totalInput = chunk.usageMetadata.promptTokenCount || totalInput
        totalOutput = chunk.usageMetadata.candidatesTokenCount || totalOutput
      }
    }

    yield { type: 'usage', inputTokens: totalInput, outputTokens: totalOutput }
    yield { type: 'stop', stopReason: hasToolCalls ? 'tool_use' : 'end_turn' }
  }

  estimateTokens(text: string): number {
    // Gemini uses roughly similar tokenization to GPT
    return Math.ceil(text.length / 4)
  }

  listModels(): ModelInfo[] {
    const def = getProviderDef('gemini')
    if (!def) return []
    return def.models.map(m => ({
      id: m.id, name: m.name, maxTokens: m.maxTokens,
      supportsTools: m.supportsTools,
      costPerInputToken: m.costPerInputToken, costPerOutputToken: m.costPerOutputToken,
    }))
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const def = getProviderDef('gemini')
      const client = new GoogleGenAI({ apiKey })
      await client.models.generateContent({
        model: def?.validationModel || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        config: { maxOutputTokens: 1 },
      })
      return true
    } catch {
      return false
    }
  }
}
