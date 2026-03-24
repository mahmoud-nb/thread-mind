import { resolve, relative } from 'path'
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'

interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileEntry[]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.projectId as string
  const relPath = (query.path as string) || '.'
  const depth = parseInt(query.depth as string) || 2

  if (!projectId) {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const prisma = usePrisma()
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  })

  const fullPath = resolve(project.targetPath, relPath)
  if (!fullPath.startsWith(resolve(project.targetPath))) {
    throw createError({ statusCode: 403, message: 'Path traversal not allowed' })
  }

  if (!existsSync(fullPath)) {
    throw createError({ statusCode: 404, message: 'Directory not found' })
  }

  const tree = await buildTree(fullPath, project.targetPath, depth, 0)
  return tree
})

async function buildTree(dirPath: string, rootPath: string, maxDepth: number, currentDepth: number): Promise<FileEntry[]> {
  if (currentDepth >= maxDepth) return []

  const entries = await readdir(dirPath, { withFileTypes: true })
  const result: FileEntry[] = []

  const sorted = entries
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  for (const entry of sorted) {
    const fullPath = resolve(dirPath, entry.name)
    const relPath = relative(rootPath, fullPath)

    if (entry.isDirectory()) {
      const children = currentDepth < maxDepth - 1
        ? await buildTree(fullPath, rootPath, maxDepth, currentDepth + 1)
        : undefined
      result.push({ name: entry.name, path: relPath, type: 'directory', children })
    } else {
      const stats = await stat(fullPath)
      result.push({ name: entry.name, path: relPath, type: 'file', size: stats.size })
    }
  }

  return result
}
