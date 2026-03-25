/**
 * ============================================================
 *  SINGLE SOURCE OF TRUTH — AI Providers & Models
 * ============================================================
 *
 *  Add / remove / update providers and models here.
 *  Everything else (provider factory, settings UI, token counter)
 *  reads from this registry.
 * ============================================================
 */

export interface ModelDef {
  id: string
  name: string
  maxTokens: number
  supportsTools: boolean
  costPerInputToken: number
  costPerOutputToken: number
}

export type ProviderType = 'anthropic' | 'openai-compat' | 'gemini'

export interface ProviderDef {
  /** Unique key stored in DB */
  key: string
  /** Human-readable name */
  name: string
  /** UI color class */
  color: string
  /** Underlying SDK to use */
  type: ProviderType
  /**
   * For openai-compat providers, the base URL of the API.
   * Omit for native OpenAI.
   */
  baseURL?: string
  /** Model used to validate the API key (cheapest / fastest) */
  validationModel: string
  /** Available models */
  models: ModelDef[]
}

// ────────────────────────────────────────────
//  REGISTRY
// ────────────────────────────────────────────

export const PROVIDER_REGISTRY: ProviderDef[] = [
  // ── Anthropic ──────────────────────────────
  {
    key: 'anthropic',
    name: 'Anthropic (Claude)',
    color: 'text-orange-400',
    type: 'anthropic',
    validationModel: 'claude-haiku-4-5-20251001',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 200000, supportsTools: true, costPerInputToken: 0.000003, costPerOutputToken: 0.000015 },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', maxTokens: 200000, supportsTools: true, costPerInputToken: 0.0000008, costPerOutputToken: 0.000004 },
    ],
  },

  // ── OpenAI ─────────────────────────────────
  {
    key: 'openai',
    name: 'OpenAI (GPT)',
    color: 'text-green-400',
    type: 'openai-compat',
    validationModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.0000025, costPerOutputToken: 0.00001 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.00000015, costPerOutputToken: 0.0000006 },
      { id: 'o3-mini', name: 'o3-mini', maxTokens: 200000, supportsTools: true, costPerInputToken: 0.0000011, costPerOutputToken: 0.0000044 },
    ],
  },

  // ── Google Gemini ──────────────────────────
  {
    key: 'gemini',
    name: 'Google (Gemini)',
    color: 'text-blue-400',
    type: 'gemini',
    validationModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', maxTokens: 1000000, supportsTools: true, costPerInputToken: 0.00000015, costPerOutputToken: 0.0000006 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 1000000, supportsTools: true, costPerInputToken: 0.00000125, costPerOutputToken: 0.00001 },
    ],
  },

  // ── DeepSeek ───────────────────────────────
  {
    key: 'deepseek',
    name: 'DeepSeek',
    color: 'text-cyan-400',
    type: 'openai-compat',
    baseURL: 'https://api.deepseek.com',
    validationModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.00000014, costPerOutputToken: 0.00000028 },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', maxTokens: 128000, supportsTools: false, costPerInputToken: 0.00000055, costPerOutputToken: 0.00000219 },
    ],
  },

  // ── Mistral ────────────────────────────────
  {
    key: 'mistral',
    name: 'Mistral AI',
    color: 'text-amber-400',
    type: 'openai-compat',
    baseURL: 'https://api.mistral.ai/v1',
    validationModel: 'mistral-small-latest',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.000002, costPerOutputToken: 0.000006 },
      { id: 'mistral-small-latest', name: 'Mistral Small', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.0000001, costPerOutputToken: 0.0000003 },
      { id: 'codestral-latest', name: 'Codestral', maxTokens: 256000, supportsTools: true, costPerInputToken: 0.0000003, costPerOutputToken: 0.0000009 },
    ],
  },

  // ── Meta Llama (via Together AI) ───────────
  {
    key: 'meta',
    name: 'Meta (Llama)',
    color: 'text-indigo-400',
    type: 'openai-compat',
    baseURL: 'https://api.together.xyz/v1',
    validationModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: [
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', maxTokens: 1048576, supportsTools: true, costPerInputToken: 0.00000027, costPerOutputToken: 0.00000085 },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', maxTokens: 128000, supportsTools: true, costPerInputToken: 0.00000088, costPerOutputToken: 0.00000088 },
    ],
  },
]

// ────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────

export function getProviderDef(key: string): ProviderDef | undefined {
  return PROVIDER_REGISTRY.find(p => p.key === key)
}

export function getModelDef(modelId: string): ModelDef | undefined {
  for (const p of PROVIDER_REGISTRY) {
    const m = p.models.find(m => m.id === modelId)
    if (m) return m
  }
  return undefined
}

export function getProviderForModel(modelId: string): ProviderDef | undefined {
  return PROVIDER_REGISTRY.find(p => p.models.some(m => m.id === modelId))
}
