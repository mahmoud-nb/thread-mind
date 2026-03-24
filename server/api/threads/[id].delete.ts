export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  const thread = await prisma.thread.findUnique({ where: { id } })
  if (!thread) {
    throw createError({ statusCode: 404, message: 'Thread not found' })
  }
  if (thread.isReadOnly) {
    throw createError({ statusCode: 403, message: 'Cannot delete read-only thread' })
  }

  // Recursive delete: children first (Prisma cascade handles messages)
  async function deleteRecursive(threadId: string) {
    const children = await prisma.thread.findMany({
      where: { parentId: threadId },
      select: { id: true },
    })
    for (const child of children) {
      await deleteRecursive(child.id)
    }
    await prisma.thread.delete({ where: { id: threadId } })
  }

  await deleteRecursive(id)
  return { success: true }
})
