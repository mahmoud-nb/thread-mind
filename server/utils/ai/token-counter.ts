import { getModelDef } from './model-registry'
import type { ModelInfo } from './types'

export function getModelInfo(modelId: string): ModelInfo | undefined {
  const def = getModelDef(modelId)
  if (!def) return undefined
  return {
    id: def.id,
    name: def.name,
    maxTokens: def.maxTokens,
    supportsTools: def.supportsTools,
    costPerInputToken: def.costPerInputToken,
    costPerOutputToken: def.costPerOutputToken,
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelDef(modelId)
  if (!model) return 0
  return (inputTokens * model.costPerInputToken) + (outputTokens * model.costPerOutputToken)
}

export function getMaxContextTokens(modelId: string): number {
  const model = getModelDef(modelId)
  return model?.maxTokens || 128000
}
