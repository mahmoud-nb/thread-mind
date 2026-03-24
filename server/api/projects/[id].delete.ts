export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  await prisma.project.delete({ where: { id } })
  return { success: true }
})
