import { resolve, join } from 'path'
import { readFile, writeFile, readdir, mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'

const THREADMIND_DIR = '.threadmind'

interface ThreadExport {
  id: string
  parentId: string | null
  title: string
  status: string
  sortOrder: number
}

interface TreeJson {
  version: number
  projectName: string
  exportedAt: string
  exportedBy: string
  threads: ThreadExport[]
}

interface ThreadMeta {
  id: string
  title: string
  status: string
  systemPrompt: string | null
  author: string | null
  createdAt: string
  updatedAt: string
}

export async function exportToThreadmind(projectId: string): Promise<void> {
  const prisma = usePrisma()

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      threads: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const threadmindDir = resolve(project.targetPath, THREADMIND_DIR)
  const threadsDir = join(threadmindDir, 'threads')

  // Ensure directories exist
  await mkdir(threadsDir, { recursive: true })

  // Write tree.json
  const treeJson: TreeJson = {
    version: 1,
    projectName: project.name,
    exportedAt: new Date().toISOString(),
    exportedBy: 'local',
    threads: project.threads.map(t => ({
      id: t.id,
      parentId: t.parentId,
      title: t.title,
      status: t.status,
      sortOrder: t.sortOrder,
    })),
  }

  await writeFile(
    join(threadmindDir, 'tree.json'),
    JSON.stringify(treeJson, null, 2),
    'utf-8'
  )

  // Write each thread's meta.json and summary.md
  for (const thread of project.threads) {
    const threadDir = join(threadsDir, thread.id)
    await mkdir(threadDir, { recursive: true })

    const meta: ThreadMeta = {
      id: thread.id,
      title: thread.title,
      status: thread.status,
      systemPrompt: thread.systemPrompt,
      author: thread.sourceAuthor || 'local',
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }

    await writeFile(
      join(threadDir, 'meta.json'),
      JSON.stringify(meta, null, 2),
      'utf-8'
    )

    if (thread.summary) {
      const summaryContent = `# ${thread.title}\n\n${thread.summary}`
      await writeFile(join(threadDir, 'summary.md'), summaryContent, 'utf-8')
    }
  }

  // Clean up threads that no longer exist
  if (existsSync(threadsDir)) {
    const existingDirs = await readdir(threadsDir)
    const threadIds = new Set(project.threads.map(t => t.id))

    for (const dir of existingDirs) {
      if (!threadIds.has(dir)) {
        await rm(join(threadsDir, dir), { recursive: true, force: true })
      }
    }
  }
}

export async function importFromThreadmind(projectId: string): Promise<{ imported: number; updated: number }> {
  const prisma = usePrisma()

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  })

  const threadmindDir = resolve(project.targetPath, THREADMIND_DIR)
  const treeJsonPath = join(threadmindDir, 'tree.json')

  if (!existsSync(treeJsonPath)) {
    return { imported: 0, updated: 0 }
  }

  const treeContent = await readFile(treeJsonPath, 'utf-8')
  const treeJson: TreeJson = JSON.parse(treeContent)

  let imported = 0
  let updated = 0

  // Process threads in order (parents first)
  for (const threadEntry of treeJson.threads) {
    const threadDir = join(threadmindDir, 'threads', threadEntry.id)

    // Read meta
    let meta: ThreadMeta | null = null
    const metaPath = join(threadDir, 'meta.json')
    if (existsSync(metaPath)) {
      const metaContent = await readFile(metaPath, 'utf-8')
      meta = JSON.parse(metaContent)
    }

    // Read summary
    let summary: string | null = null
    const summaryPath = join(threadDir, 'summary.md')
    if (existsSync(summaryPath)) {
      const summaryContent = await readFile(summaryPath, 'utf-8')
      // Remove the title line
      const lines = summaryContent.split('\n')
      summary = lines.slice(2).join('\n').trim() || null
    }

    // Check if thread exists locally
    const existing = await prisma.thread.findUnique({
      where: { id: threadEntry.id },
    })

    if (!existing) {
      // Create as read-only imported thread
      await prisma.thread.create({
        data: {
          id: threadEntry.id,
          projectId,
          parentId: threadEntry.parentId,
          title: threadEntry.title,
          status: threadEntry.status,
          sortOrder: threadEntry.sortOrder,
          systemPrompt: meta?.systemPrompt || null,
          summary,
          isReadOnly: true,
          sourceAuthor: meta?.author || 'unknown',
        },
      })
      imported++
    } else if (existing.isReadOnly) {
      // Update read-only thread with latest data
      await prisma.thread.update({
        where: { id: threadEntry.id },
        data: {
          title: threadEntry.title,
          status: threadEntry.status,
          summary,
          systemPrompt: meta?.systemPrompt || existing.systemPrompt,
        },
      })
      updated++
    }
    // Skip local (non-read-only) threads
  }

  return { imported, updated }
}
