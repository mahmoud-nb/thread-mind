import { computeSummaryHash, buildSummaryPrompt } from '~~/server/utils/context-engine'
import { createProvider } from '~~/server/utils/ai/provider'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (thread.messages.length === 0) {
    throw createError({ statusCode: 400, message: 'No messages to summarize' })
  }

  // Get cheapest available provider
  const configs = await prisma.providerConfig.findMany({ where: { isActive: true } })
  if (configs.length === 0) {
    throw createError({ statusCode: 400, message: 'No AI provider configured' })
  }

  // Prefer cheapest model for summaries
  const config = configs[0]
  const provider = createProvider(config.provider, config.apiKey)
  const models = provider.listModels()
  const cheapestModel = models.sort((a, b) => a.costPerInputToken - b.costPerInputToken)[0]

  const summaryPrompt = buildSummaryPrompt(
    thread.title,
    thread.systemPrompt,
    thread.messages
  )

  const response = await provider.chat({
    model: cheapestModel.id,
    systemPrompt: 'You are a concise summarizer for development conversations.',
    messages: [{ role: 'user', content: summaryPrompt }],
    maxTokens: 1024,
  })

  const messageIds = thread.messages.map(m => m.id)
  const hash = computeSummaryHash(messageIds)

  await prisma.thread.update({
    where: { id },
    data: {
      summary: response.content,
      summaryHash: hash,
    },
  })

  // Track token usage
  await prisma.tokenUsage.create({
    data: {
      projectId: thread.projectId,
      threadId: id,
      provider: config.provider,
      model: cheapestModel.id,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      estimatedCostUsd:
        response.usage.inputTokens * cheapestModel.costPerInputToken +
        response.usage.outputTokens * cheapestModel.costPerOutputToken,
    },
  })

  return { summary: response.content, hash }
})
