import type { ModelInfo } from './types'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'

const MODEL_REGISTRY: Map<string, ModelInfo> = new Map()

function initRegistry() {
  if (MODEL_REGISTRY.size > 0) return

  const providers = [new AnthropicProvider(''), new OpenAIProvider(''), new GeminiProvider('')]
  for (const provider of providers) {
    for (const model of provider.listModels()) {
      MODEL_REGISTRY.set(model.id, model)
    }
  }
}

export function getModelInfo(modelId: string): ModelInfo | undefined {
  initRegistry()
  return MODEL_REGISTRY.get(modelId)
}

export function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelInfo(modelId)
  if (!model) return 0
  return (inputTokens * model.costPerInputToken) + (outputTokens * model.costPerOutputToken)
}

export function getMaxContextTokens(modelId: string): number {
  const model = getModelInfo(modelId)
  return model?.maxTokens || 128000
}
