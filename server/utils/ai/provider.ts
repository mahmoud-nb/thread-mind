import type { AIProvider } from './types'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { getProviderDef } from './model-registry'

export function createProvider(providerName: string, apiKey: string): AIProvider {
  const def = getProviderDef(providerName)

  if (!def) {
    throw new Error(`Unknown provider: ${providerName}`)
  }

  switch (def.type) {
    case 'anthropic':
      return new AnthropicProvider(apiKey)
    case 'openai-compat':
      return new OpenAIProvider(apiKey, def.baseURL, def.key)
    case 'gemini':
      return new GeminiProvider(apiKey)
    default:
      throw new Error(`Unsupported provider type: ${def.type}`)
  }
}

export async function getConfiguredProvider(): Promise<{ provider: AIProvider; model: string } | null> {
  const prisma = usePrisma()

  const configs = await prisma.providerConfig.findMany({
    where: { isActive: true },
  })

  if (configs.length === 0) return null

  const config = configs[0]
  const provider = createProvider(config.provider, config.apiKey)
  const models = JSON.parse(config.models) as string[]
  const model = models[0] || provider.listModels()[0]?.id

  if (!model) return null

  return { provider, model }
}
