export default defineEventHandler(async (event) => {
  const body = await readBody<{
    projectId: string
    parentId?: string
    title: string
    systemPrompt?: string
  }>(event)

  if (!body.projectId || !body.title) {
    throw createError({ statusCode: 400, message: 'projectId and title are required' })
  }

  const prisma = usePrisma()

  // If parentId specified, verify it exists and is in the same project
  if (body.parentId) {
    const parent = await prisma.thread.findUnique({
      where: { id: body.parentId },
    })
    if (!parent || parent.projectId !== body.projectId) {
      throw createError({ statusCode: 400, message: 'Invalid parent thread' })
    }
  }

  const authorName = await getAuthorName()

  const thread = await prisma.thread.create({
    data: {
      projectId: body.projectId,
      parentId: body.parentId || null,
      title: body.title,
      systemPrompt: body.systemPrompt || null,
      sourceAuthor: authorName,
    },
  })

  return thread
})
