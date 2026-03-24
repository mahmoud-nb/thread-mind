import { resolve } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.projectId as string
  const filePath = query.path as string

  if (!projectId || !filePath) {
    throw createError({ statusCode: 400, message: 'projectId and path are required' })
  }

  const prisma = usePrisma()
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })

  const fullPath = resolve(project.targetPath, filePath)
  if (!fullPath.startsWith(resolve(project.targetPath))) {
    throw createError({ statusCode: 403, message: 'Path traversal not allowed' })
  }

  if (!existsSync(fullPath)) {
    throw createError({ statusCode: 404, message: 'File not found' })
  }

  const content = await readFile(fullPath, 'utf-8')
  return { path: filePath, content }
})
