export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ isPinned?: boolean }>(event)

  const prisma = usePrisma()
  return prisma.message.update({
    where: { id },
    data: {
      ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
    },
  })
})
