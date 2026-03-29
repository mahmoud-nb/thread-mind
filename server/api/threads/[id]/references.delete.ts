export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ referencedId: string }>(event)

  if (!body.referencedId) {
    throw createError({ statusCode: 400, message: 'referencedId is required' })
  }

  const prisma = usePrisma()

  await prisma.threadReference.deleteMany({
    where: {
      threadId: id,
      referencedId: body.referencedId,
    },
  })

  return { success: true }
})
