export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name: string
    targetPath: string
    workMode: 'solo' | 'team'
  }>(event)

  if (!body.name || !body.targetPath) {
    throw createError({ statusCode: 400, message: 'Name and targetPath are required' })
  }

  const prisma = usePrisma()

  const project = await prisma.project.create({
    data: {
      name: body.name,
      targetPath: body.targetPath,
      workMode: body.workMode || 'solo',
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  })

  return project
})
