export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.projectId as string

  if (!projectId) {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const prisma = usePrisma()
  return prisma.thread.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      parentId: true,
      title: true,
      status: true,
      systemPrompt: true,
      summary: true,
      summaryHash: true,
      sortOrder: true,
      isReadOnly: true,
      sourceAuthor: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true, children: true } },
    },
  })
})
