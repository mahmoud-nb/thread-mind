<script setup lang="ts">
interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileEntry[]
}

const props = defineProps<{
  entry: FileEntry
  expandedDirs: Set<string>
  depth: number
}>()

const emit = defineEmits<{
  click: [entry: FileEntry]
}>()

const isExpanded = computed(() => props.expandedDirs.has(props.entry.path))
const isDir = computed(() => props.entry.type === 'directory')

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`
}
</script>

<template>
  <div>
    <button
      class="flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-xs hover:bg-surface-800 transition-colors"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
      @click="emit('click', entry)"
    >
      <!-- Icon -->
      <svg v-if="isDir" class="h-3.5 w-3.5 flex-shrink-0 text-surface-500" :class="{ 'rotate-90': isExpanded }" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
      </svg>
      <svg v-else class="h-3.5 w-3.5 flex-shrink-0 text-surface-600" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
      </svg>
      <span class="flex-1 truncate text-left" :class="isDir ? 'text-surface-300 font-medium' : 'text-surface-400'">
        {{ entry.name }}
      </span>
      <span v-if="!isDir && entry.size" class="flex-shrink-0 text-surface-600">{{ formatSize(entry.size) }}</span>
    </button>

    <!-- Children -->
    <template v-if="isDir && isExpanded && entry.children">
      <FileNode
        v-for="child in entry.children"
        :key="child.path"
        :entry="child"
        :expanded-dirs="expandedDirs"
        :depth="depth + 1"
        @click="emit('click', $event)"
      />
    </template>
  </div>
</template>
