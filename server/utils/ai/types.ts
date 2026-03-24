export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content: string
  toolCallId?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ChatParams {
  model: string
  systemPrompt: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  maxTokens?: number
  temperature?: number
}

export interface ChatResponse {
  content: string
  toolCalls: ToolCall[]
  stopReason: string
  usage: TokenUsageData
}

export interface TokenUsageData {
  inputTokens: number
  outputTokens: number
}

export type StreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'stop'; stopReason: 'end_turn' | 'tool_use' | 'max_tokens' }
  | { type: 'usage'; inputTokens: number; outputTokens: number }

export interface ModelInfo {
  id: string
  name: string
  maxTokens: number
  supportsTools: boolean
  costPerInputToken: number
  costPerOutputToken: number
}

export interface AIProvider {
  readonly name: 'anthropic' | 'openai' | 'gemini'
  chat(params: ChatParams): Promise<ChatResponse>
  chatStream(params: ChatParams): AsyncIterable<StreamEvent>
  estimateTokens(text: string): number
  listModels(): ModelInfo[]
  validateApiKey(apiKey: string): Promise<boolean>
}
