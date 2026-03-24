export default defineEventHandler(async (event) => {
  const body = await readBody<{
    language?: string
    theme?: string
    openBrowser?: boolean
  }>(event)

  const prisma = usePrisma()

  return prisma.appSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      ...body,
    },
    update: body,
  })
})
