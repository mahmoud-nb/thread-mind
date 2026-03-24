import { createProvider } from '~~/server/utils/ai/provider'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    provider: string
    apiKey: string
  }>(event)

  if (!body.provider || !body.apiKey) {
    throw createError({ statusCode: 400, message: 'provider and apiKey are required' })
  }

  try {
    const provider = createProvider(body.provider, body.apiKey)
    const valid = await provider.validateApiKey(body.apiKey)
    return { success: valid }
  } catch {
    return { success: false }
  }
})
