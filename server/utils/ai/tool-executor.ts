import { resolve, relative, dirname } from 'path'
import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

interface ToolResult {
  content: string
  isError: boolean
}

function validatePath(projectPath: string, relativePath: string): string {
  const resolved = resolve(projectPath, relativePath)
  const normalizedProject = resolve(projectPath)

  if (!resolved.startsWith(normalizedProject)) {
    throw new Error(`Path traversal detected: ${relativePath}`)
  }

  return resolved
}

async function readFileHandler(projectPath: string, input: Record<string, unknown>): Promise<ToolResult> {
  const path = validatePath(projectPath, input.path as string)

  if (!existsSync(path)) {
    return { content: `File not found: ${input.path}`, isError: true }
  }

  const content = await readFile(path, 'utf-8')
  const lines = content.split('\n')

  const startLine = (input.startLine as number) || 1
  const endLine = (input.endLine as number) || lines.length

  const selected = lines.slice(startLine - 1, endLine)
  const numbered = selected.map((line, i) => `${startLine + i}\t${line}`).join('\n')

  return { content: numbered, isError: false }
}

async function writeFileHandler(projectPath: string, input: Record<string, unknown>): Promise<ToolResult> {
  const path = validatePath(projectPath, input.path as string)
  const content = input.content as string

  const dir = dirname(path)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  await writeFile(path, content, 'utf-8')
  return { content: `File written: ${input.path}`, isError: false }
}

async function editFileHandler(projectPath: string, input: Record<string, unknown>): Promise<ToolResult> {
  const path = validatePath(projectPath, input.path as string)
  const search = input.search as string
  const replace = input.replace as string

  if (!existsSync(path)) {
    return { content: `File not found: ${input.path}`, isError: true }
  }

  const content = await readFile(path, 'utf-8')
  if (!content.includes(search)) {
    return { content: `Search text not found in ${input.path}`, isError: true }
  }

  const newContent = content.replace(search, replace)
  await writeFile(path, newContent, 'utf-8')
  return { content: `File edited: ${input.path}`, isError: false }
}

async function listDirectoryHandler(projectPath: string, input: Record<string, unknown>): Promise<ToolResult> {
  const relPath = (input.path as string) || '.'
  const path = validatePath(projectPath, relPath)
  const recursive = input.recursive as boolean || false

  if (!existsSync(path)) {
    return { content: `Directory not found: ${relPath}`, isError: true }
  }

  const entries = await listDir(path, projectPath, recursive ? 3 : 1, 0)
  return { content: entries.join('\n'), isError: false }
}

async function listDir(dirPath: string, projectPath: string, maxDepth: number, currentDepth: number): Promise<string[]> {
  if (currentDepth >= maxDepth) return []

  const entries = await readdir(dirPath, { withFileTypes: true })
  const result: string[] = []
  const indent = '  '.repeat(currentDepth)

  // Sort: directories first, then files
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  for (const entry of sorted) {
    // Skip hidden dirs and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

    const fullPath = resolve(dirPath, entry.name)
    const relPath = relative(projectPath, fullPath)

    if (entry.isDirectory()) {
      result.push(`${indent}[dir]  ${relPath}/`)
      if (currentDepth < maxDepth - 1) {
        const subEntries = await listDir(fullPath, projectPath, maxDepth, currentDepth + 1)
        result.push(...subEntries)
      }
    } else {
      const stats = await stat(fullPath)
      const size = formatSize(stats.size)
      result.push(`${indent}[file] ${relPath} (${size})`)
    }
  }

  return result
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

async function searchFilesHandler(projectPath: string, input: Record<string, unknown>): Promise<ToolResult> {
  const query = input.query as string
  const searchPath = validatePath(projectPath, (input.path as string) || '.')
  const globPattern = input.glob as string | undefined

  try {
    const results = await searchInDirectory(searchPath, projectPath, query, globPattern)
    if (results.length === 0) {
      return { content: 'No matches found.', isError: false }
    }
    return { content: results.slice(0, 50).join('\n'), isError: false }
  } catch (err: any) {
    return { content: `Search error: ${err.message}`, isError: true }
  }
}

async function searchInDirectory(
  dirPath: string,
  projectPath: string,
  query: string,
  globPattern?: string,
  results: string[] = [],
  depth = 0
): Promise<string[]> {
  if (depth > 5 || results.length >= 50) return results

  const entries = await readdir(dirPath, { withFileTypes: true })
  const regex = new RegExp(query, 'gi')

  for (const entry of entries) {
    if (results.length >= 50) break
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

    const fullPath = resolve(dirPath, entry.name)
    const relPath = relative(projectPath, fullPath)

    if (entry.isDirectory()) {
      await searchInDirectory(fullPath, projectPath, query, globPattern, results, depth + 1)
    } else {
      if (globPattern && !matchGlob(entry.name, globPattern)) continue

      try {
        const stats = await stat(fullPath)
        if (stats.size > 512 * 1024) continue // skip files > 512KB

        const content = await readFile(fullPath, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            const contextStart = Math.max(0, i - 1)
            const contextEnd = Math.min(lines.length - 1, i + 1)
            const context = lines.slice(contextStart, contextEnd + 1)
              .map((l, j) => `${contextStart + j + 1}\t${l}`)
              .join('\n')
            results.push(`--- ${relPath}:${i + 1} ---\n${context}`)
            regex.lastIndex = 0
          }
          if (results.length >= 50) break
        }
      } catch {
        // Skip binary/unreadable files
      }
    }
  }

  return results
}

function matchGlob(filename: string, pattern: string): boolean {
  // Simple glob matching for common patterns like *.ts, *.vue
  const ext = pattern.replace(/^\*/, '')
  return filename.endsWith(ext)
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  projectPath: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'read_file':
        return await readFileHandler(projectPath, input)
      case 'write_file':
        return await writeFileHandler(projectPath, input)
      case 'edit_file':
        return await editFileHandler(projectPath, input)
      case 'list_directory':
        return await listDirectoryHandler(projectPath, input)
      case 'search_files':
        return await searchFilesHandler(projectPath, input)
      default:
        return { content: `Unknown tool: ${toolName}`, isError: true }
    }
  } catch (err: any) {
    return { content: `Tool error: ${err.message}`, isError: true }
  }
}
