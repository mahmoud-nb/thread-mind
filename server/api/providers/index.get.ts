import { createProvider } from '~~/server/utils/ai/provider'

export default defineEventHandler(async () => {
  const prisma = usePrisma()
  const configs = await prisma.providerConfig.findMany()

  return configs.map(c => ({
    id: c.id,
    provider: c.provider,
    isActive: c.isActive,
    hasApiKey: !!c.apiKey,
    models: JSON.parse(c.models),
    availableModels: createProvider(c.provider, '').listModels(),
  }))
})
