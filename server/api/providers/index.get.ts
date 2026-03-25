import { PROVIDER_REGISTRY } from '~~/server/utils/ai/model-registry'

export default defineEventHandler(async () => {
  const prisma = usePrisma()
  const configs = await prisma.providerConfig.findMany()
  const configMap = new Map(configs.map(c => [c.provider, c]))

  // Return ALL providers from registry, merging with saved config
  return PROVIDER_REGISTRY.map(def => {
    const config = configMap.get(def.key)
    return {
      provider: def.key,
      name: def.name,
      color: def.color,
      isActive: config?.isActive ?? false,
      hasApiKey: !!config?.apiKey,
      models: config ? JSON.parse(config.models) : [],
      availableModels: def.models.map(m => ({ id: m.id, name: m.name })),
    }
  })
})
