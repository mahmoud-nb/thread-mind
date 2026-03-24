export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      settings: true,
      threads: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true, parentId: true, status: true, isReadOnly: true, sortOrder: true },
      },
    },
  })

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  return project
})
