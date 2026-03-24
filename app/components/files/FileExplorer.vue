<script setup lang="ts">
const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const { tree, openFile, loading, fetchTree, readFile, closeFile } = useFileExplorer()

await fetchTree(props.projectId)

interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileEntry[]
}

const expandedDirs = ref(new Set<string>())

function toggleDir(path: string) {
  if (expandedDirs.value.has(path)) {
    expandedDirs.value.delete(path)
  } else {
    expandedDirs.value.add(path)
  }
}

async function handleFileClick(entry: FileEntry) {
  if (entry.type === 'directory') {
    toggleDir(entry.path)
  } else {
    await readFile(props.projectId, entry.path)
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`
}

function getFileIcon(name: string): string {
  if (name.endsWith('.vue')) return 'text-green-400'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'text-blue-400'
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'text-yellow-400'
  if (name.endsWith('.json')) return 'text-amber-400'
  if (name.endsWith('.md')) return 'text-surface-400'
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'text-pink-400'
  return 'text-surface-500'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-surface-800 px-3 py-2">
      <span class="text-xs font-medium uppercase tracking-wider text-surface-500">{{ t('files.title') }}</span>
      <button class="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300" @click="fetchTree(projectId)">
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
      </button>
    </div>

    <div v-if="openFile" class="flex-1 overflow-hidden flex flex-col">
      <!-- File viewer header -->
      <div class="flex items-center justify-between border-b border-surface-800 bg-surface-900 px-3 py-1.5">
        <span class="truncate text-xs font-mono text-surface-400">{{ openFile.path }}</span>
        <button class="rounded p-0.5 text-surface-500 hover:text-surface-300" @click="closeFile">
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      <pre class="flex-1 overflow-auto p-3 text-xs font-mono text-surface-300 bg-surface-950">{{ openFile.content }}</pre>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-2">
      <template v-for="entry in tree" :key="entry.path">
        <FileNode
          :entry="entry"
          :expanded-dirs="expandedDirs"
          :depth="0"
          @click="handleFileClick"
        />
      </template>
    </div>
  </div>
</template>
