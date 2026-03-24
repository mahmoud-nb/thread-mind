interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileEntry[]
}

export function useFileExplorer() {
  const tree = ref<FileEntry[]>([])
  const openFile = ref<{ path: string; content: string } | null>(null)
  const loading = ref(false)

  async function fetchTree(projectId: string, path = '.') {
    loading.value = true
    try {
      tree.value = await $fetch('/api/files/tree', {
        params: { projectId, path, depth: 3 },
      })
    } finally {
      loading.value = false
    }
  }

  async function readFile(projectId: string, path: string) {
    const result = await $fetch('/api/files/read', {
      params: { projectId, path },
    }) as { path: string; content: string }
    openFile.value = result
    return result
  }

  function closeFile() {
    openFile.value = null
  }

  return {
    tree,
    openFile,
    loading,
    fetchTree,
    readFile,
    closeFile,
  }
}
