import { userInfo } from 'os'

export async function getAuthorName(): Promise<string> {
  const prisma = usePrisma()
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  const name = settings?.authorName?.trim()
  if (name) return name

  // Fallback to OS username
  try {
    return userInfo().username
  } catch {
    return 'local'
  }
}
