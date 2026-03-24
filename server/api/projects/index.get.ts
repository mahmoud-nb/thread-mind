export default defineEventHandler(async () => {
  const prisma = usePrisma()
  return prisma.project.findMany({
    include: { settings: true },
    orderBy: { updatedAt: 'desc' },
  })
})
