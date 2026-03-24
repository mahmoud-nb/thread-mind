export default defineEventHandler(async (event) => {
  const body = await readBody<{
    provider: string
    apiKey: string
    models: string[]
    isActive?: boolean
  }>(event)

  if (!body.provider || !body.apiKey) {
    throw createError({ statusCode: 400, message: 'provider and apiKey are required' })
  }

  const prisma = usePrisma()

  const config = await prisma.providerConfig.upsert({
    where: { provider: body.provider },
    create: {
      provider: body.provider,
      apiKey: body.apiKey,
      models: JSON.stringify(body.models || []),
      isActive: body.isActive ?? true,
    },
    update: {
      apiKey: body.apiKey,
      models: JSON.stringify(body.models || []),
      isActive: body.isActive ?? true,
    },
  })

  return { id: config.id, provider: config.provider, isActive: config.isActive }
})
