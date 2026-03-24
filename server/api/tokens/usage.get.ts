export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.projectId as string
  const threadId = query.threadId as string | undefined
  const from = query.from ? new Date(query.from as string) : undefined
  const to = query.to ? new Date(query.to as string) : undefined

  if (!projectId) {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const prisma = usePrisma()

  const where: any = { projectId }
  if (threadId) where.threadId = threadId
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = from
    if (to) where.createdAt.lte = to
  }

  const [usages, aggregates] = await Promise.all([
    prisma.tokenUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.tokenUsage.aggregate({
      where,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
        contextTokensSaved: true,
      },
      _count: true,
    }),
  ])

  return {
    items: usages,
    totals: {
      inputTokens: aggregates._sum.inputTokens || 0,
      outputTokens: aggregates._sum.outputTokens || 0,
      totalTokens: (aggregates._sum.inputTokens || 0) + (aggregates._sum.outputTokens || 0),
      estimatedCost: aggregates._sum.estimatedCostUsd || 0,
      tokensSaved: aggregates._sum.contextTokensSaved || 0,
      requestCount: aggregates._count,
    },
  }
})
