import { resolve, join } from 'path'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const prisma = usePrisma()

  // Get the project to access its targetPath
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  // Clean up .threadmind/ directory in target path
  const threadmindDir = resolve(project.targetPath, '.threadmind')
  if (existsSync(threadmindDir)) {
    try {
      await rm(threadmindDir, { recursive: true, force: true })
    } catch {
      // Non-blocking: if cleanup fails, still delete from DB
    }
  }

  // Delete project (cascades to threads, messages, settings, tokenUsages)
  await prisma.project.delete({ where: { id } })

  return { success: true }
})
