export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    name?: string
    targetPath?: string
    workMode?: string
    settings?: {
      defaultProvider?: string
      defaultModel?: string
      language?: string
      customPrompt?: string
    }
  }>(event)

  const prisma = usePrisma()

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.targetPath && { targetPath: body.targetPath }),
      ...(body.workMode && { workMode: body.workMode }),
      ...(body.settings && {
        settings: {
          upsert: {
            create: body.settings,
            update: body.settings,
          },
        },
      }),
    },
    include: { settings: true },
  })

  return project
})
