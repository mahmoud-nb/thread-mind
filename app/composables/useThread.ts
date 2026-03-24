interface Thread {
  id: string
  parentId: string | null
  title: string
  status: 'active' | 'resolved' | 'archived'
  systemPrompt: string | null
  summary: string | null
  summaryHash: string | null
  sortOrder: number
  isReadOnly: boolean
  sourceAuthor: string | null
  createdAt: string
  updatedAt: string
  _count?: { messages: number; children: number }
}

interface ThreadDetail extends Thread {
  messages: Array<{
    id: string
    role: string
    content: string
    isPinned: boolean
    metadata: string | null
    createdAt: string
  }>
  children: Array<{ id: string; title: string; status: string; isReadOnly: boolean }>
}

const activeThreadId = ref<string | null>(null)

export function useThread() {
  const threads = ref<Thread[]>([])
  const activeThread = ref<ThreadDetail | null>(null)
  const loading = ref(false)

  const threadTree = computed(() => buildTree(threads.value))

  function buildTree(flatThreads: Thread[]): (Thread & { children: Thread[] })[] {
    const map = new Map<string | null, Thread[]>()
    for (const t of flatThreads) {
      const parentId = t.parentId || null
      if (!map.has(parentId)) map.set(parentId, [])
      map.get(parentId)!.push(t)
    }

    function attachChildren(parentId: string | null): (Thread & { children: Thread[] })[] {
      return (map.get(parentId) || []).map(t => ({
        ...t,
        children: attachChildren(t.id),
      }))
    }

    return attachChildren(null)
  }

  async function fetchThreads(projectId: string) {
    loading.value = true
    try {
      threads.value = await $fetch('/api/threads', { params: { projectId } })
    } finally {
      loading.value = false
    }
  }

  async function fetchThread(id: string) {
    activeThread.value = await $fetch(`/api/threads/${id}`) as ThreadDetail
    activeThreadId.value = id
  }

  async function createThread(data: { projectId: string; parentId?: string; title: string; systemPrompt?: string }) {
    const thread = await $fetch('/api/threads', { method: 'POST', body: data })
    threads.value.push(thread as Thread)
    return thread
  }

  async function updateThread(id: string, data: Partial<Pick<Thread, 'title' | 'systemPrompt' | 'status' | 'sortOrder'>>) {
    const updated = await $fetch(`/api/threads/${id}`, { method: 'PUT', body: data })
    const idx = threads.value.findIndex(t => t.id === id)
    if (idx !== -1) threads.value[idx] = { ...threads.value[idx], ...updated as Thread }
    if (activeThread.value?.id === id) {
      activeThread.value = { ...activeThread.value, ...updated as ThreadDetail }
    }
    return updated
  }

  async function deleteThread(id: string) {
    await $fetch(`/api/threads/${id}`, { method: 'DELETE' })
    // Remove thread and all descendants
    const idsToRemove = new Set<string>()
    function collectIds(threadId: string) {
      idsToRemove.add(threadId)
      threads.value.filter(t => t.parentId === threadId).forEach(t => collectIds(t.id))
    }
    collectIds(id)
    threads.value = threads.value.filter(t => !idsToRemove.has(t.id))
    if (activeThreadId.value && idsToRemove.has(activeThreadId.value)) {
      activeThreadId.value = null
      activeThread.value = null
    }
  }

  async function generateSummary(id: string) {
    const result = await $fetch(`/api/threads/${id}/summary`, { method: 'POST' }) as { summary: string }
    const idx = threads.value.findIndex(t => t.id === id)
    if (idx !== -1) threads.value[idx].summary = result.summary
    if (activeThread.value?.id === id) activeThread.value.summary = result.summary
    return result
  }

  function setActiveThread(id: string | null) {
    activeThreadId.value = id
    if (!id) activeThread.value = null
  }

  return {
    threads,
    threadTree,
    activeThread,
    activeThreadId,
    loading,
    fetchThreads,
    fetchThread,
    createThread,
    updateThread,
    deleteThread,
    generateSummary,
    setActiveThread,
  }
}
