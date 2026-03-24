export default defineEventHandler(async () => {
  const prisma = usePrisma()

  let settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: 'singleton' },
    })
  }

  return settings
})
