export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50

  const prisma = usePrisma()

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      },
      children: {
        select: { id: true, title: true, status: true, isReadOnly: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { messages: true } },
    },
  })

  if (!thread) {
    throw createError({ statusCode: 404, message: 'Thread not found' })
  }

  return thread
})
