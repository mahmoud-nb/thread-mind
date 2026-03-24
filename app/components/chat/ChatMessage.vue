<script setup lang="ts">
const props = defineProps<{
  role: string
  content: string
  isPinned?: boolean
  isStreaming?: boolean
  messageId?: string
}>()

const emit = defineEmits<{
  togglePin: [id: string, pinned: boolean]
}>()

const { t } = useI18n()

const isUser = computed(() => props.role === 'user')
</script>

<template>
  <div class="group flex gap-3 px-4 py-3" :class="isUser ? '' : 'bg-surface-900/50'">
    <!-- Avatar -->
    <div
      class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-medium"
      :class="isUser ? 'bg-accent/10 text-accent' : 'bg-emerald-500/10 text-emerald-400'"
    >
      {{ isUser ? 'U' : 'AI' }}
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="prose prose-sm dark:prose-invert max-w-none break-words">
        <div v-if="content" v-html="renderMarkdown(content)" />
        <span v-if="isStreaming && !content" class="inline-flex gap-1">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-500" style="animation-delay: 0ms" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-500" style="animation-delay: 150ms" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-500" style="animation-delay: 300ms" />
        </span>
        <span v-if="isStreaming && content" class="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-surface-400" />
      </div>

      <!-- Pin indicator -->
      <div v-if="isPinned" class="mt-1 flex items-center gap-1 text-xs text-amber-400/70">
        <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        {{ t('chat.pinnedInfo') }}
      </div>
    </div>

    <!-- Actions -->
    <div v-if="messageId && !isStreaming" class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        class="rounded p-1 text-surface-600 hover:bg-surface-800 hover:text-surface-300"
        :title="isPinned ? t('chat.unpinMessage') : t('chat.pinMessage')"
        @click="emit('togglePin', messageId!, !isPinned)"
      >
        <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path v-if="isPinned" d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          <path v-else fill-rule="evenodd" d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
// Simple markdown renderer - basic conversion
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-lg bg-surface-950 p-3 my-2 overflow-x-auto text-xs"><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-800 px-1.5 py-0.5 text-xs text-accent-300">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}
</script>
