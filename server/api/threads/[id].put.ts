export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    title?: string
    systemPrompt?: string
    status?: 'active' | 'resolved' | 'archived'
    sortOrder?: number
  }>(event)

  const prisma = usePrisma()

  const thread = await prisma.thread.findUnique({ where: { id } })
  if (!thread) {
    throw createError({ statusCode: 404, message: 'Thread not found' })
  }
  if (thread.isReadOnly) {
    throw createError({ statusCode: 403, message: 'Cannot modify read-only thread' })
  }

  return prisma.thread.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  })
})
