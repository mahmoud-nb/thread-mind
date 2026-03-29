export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ referencedId: string }>(event)

  if (!body.referencedId) {
    throw createError({ statusCode: 400, message: 'referencedId is required' })
  }

  if (body.referencedId === id) {
    throw createError({ statusCode: 400, message: 'Cannot reference itself' })
  }

  const prisma = usePrisma()

  // Verify both threads exist and are in the same project
  const [thread, referenced] = await Promise.all([
    prisma.thread.findUniqueOrThrow({ where: { id } }),
    prisma.thread.findUniqueOrThrow({ where: { id: body.referencedId } }),
  ])

  if (thread.projectId !== referenced.projectId) {
    throw createError({ statusCode: 400, message: 'Threads must be in the same project' })
  }

  const ref = await prisma.threadReference.create({
    data: {
      threadId: id,
      referencedId: body.referencedId,
    },
  })

  return ref
})
