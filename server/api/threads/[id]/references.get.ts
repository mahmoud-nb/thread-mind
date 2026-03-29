export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  const references = await prisma.threadReference.findMany({
    where: { threadId: id },
    include: {
      referenced: {
        select: {
          id: true,
          title: true,
          sourceAuthor: true,
          summary: true,
          status: true,
          isReadOnly: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return references.map(ref => ({
    id: ref.id,
    threadId: ref.threadId,
    referencedId: ref.referencedId,
    title: ref.referenced.title,
    sourceAuthor: ref.referenced.sourceAuthor,
    hasSummary: !!ref.referenced.summary,
    status: ref.referenced.status,
    isReadOnly: ref.referenced.isReadOnly,
  }))
})
