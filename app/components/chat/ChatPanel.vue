<script setup lang="ts">
const props = defineProps<{
  threadId: string
  projectId: string
}>()

const { t } = useI18n()
const { activeThread, fetchThread, updateThread, generateSummary } = useThread()
const { messages, isStreaming, toolCalls, lastTokenUsage, error, loadMessages, sendMessage, togglePin, clear } = useChat()
const { activeProject } = useProject()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const showSystemPrompt = ref(false)
const editingPrompt = ref('')
const generatingSummary = ref(false)

// Fetch thread data
watch(() => props.threadId, async (id) => {
  clear()
  if (id) {
    await fetchThread(id)
    if (activeThread.value) {
      loadMessages(activeThread.value.messages)
    }
  }
}, { immediate: true })

// Auto-scroll on new messages
watch(() => messages.value.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// Also scroll during streaming
watch(() => messages.value[messages.value.length - 1]?.content, () => {
  if (isStreaming.value && messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

async function handleSend() {
  if (!messageInput.value.trim() || isStreaming.value) return
  const content = messageInput.value
  messageInput.value = ''
  await sendMessage(
    props.threadId,
    content,
    activeProject.value?.settings?.defaultProvider,
    activeProject.value?.settings?.defaultModel,
  )
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

async function handleSavePrompt() {
  await updateThread(props.threadId, { systemPrompt: editingPrompt.value })
  showSystemPrompt.value = false
}

async function handleGenerateSummary() {
  generatingSummary.value = true
  try {
    await generateSummary(props.threadId)
  } finally {
    generatingSummary.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Thread header -->
    <div v-if="activeThread" class="flex items-center justify-between border-b border-surface-800 px-4 py-2">
      <div class="flex items-center gap-2">
        <h2 class="font-medium text-surface-200">{{ activeThread.title }}</h2>
        <UBadge :variant="activeThread.status as any">
          {{ t(`thread.${activeThread.status}`) }}
        </UBadge>
        <UBadge v-if="activeThread.isReadOnly" variant="warning">
          {{ t('thread.readOnly') }}
        </UBadge>
      </div>
      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          size="sm"
          @click="showSystemPrompt = true; editingPrompt = activeThread?.systemPrompt || ''"
        >
          {{ t('thread.systemPrompt') }}
        </UButton>
        <UButton
          v-if="messages.length > 0"
          variant="ghost"
          size="sm"
          :loading="generatingSummary"
          @click="handleGenerateSummary"
        >
          {{ activeThread.summary ? t('thread.updateSummary') : t('thread.generateSummary') }}
        </UButton>
      </div>
    </div>

    <!-- Summary banner -->
    <div v-if="activeThread?.summary" class="border-b border-surface-800 bg-accent/5 px-4 py-2">
      <details>
        <summary class="cursor-pointer text-xs font-medium text-accent-400">{{ t('thread.summary') }}</summary>
        <p class="mt-1 text-xs text-surface-400">{{ activeThread.summary }}</p>
      </details>
    </div>

    <!-- Tool calls display -->
    <div v-if="toolCalls.length > 0" class="border-b border-surface-800 px-4 py-2 space-y-1">
      <div v-for="tc in toolCalls" :key="tc.id" class="rounded-md bg-surface-800/50 px-3 py-1.5 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-mono text-amber-400">{{ tc.name }}</span>
          <span v-if="tc.result" :class="tc.isError ? 'text-red-400' : 'text-green-400'">
            {{ tc.isError ? 'error' : 'done' }}
          </span>
          <span v-else class="text-surface-500 animate-pulse">{{ t('chat.thinking') }}</span>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto">
      <div v-if="messages.length === 0 && !isStreaming" class="flex h-full items-center justify-center">
        <p class="text-sm text-surface-500">{{ t('chat.noMessages') }}</p>
      </div>
      <ChatMessage
        v-for="(msg, i) in messages"
        :key="i"
        :role="msg.role"
        :content="msg.content"
        :is-pinned="msg.isPinned"
        :is-streaming="msg.isStreaming"
        :message-id="msg.id"
        @toggle-pin="togglePin"
      />
    </div>

    <!-- Token usage after response -->
    <div v-if="lastTokenUsage" class="flex items-center gap-3 border-t border-surface-800 bg-surface-900/50 px-4 py-1 text-xs text-surface-500">
      <span>{{ t('tokens.input') }}: {{ lastTokenUsage.inputTokens }}</span>
      <span>{{ t('tokens.output') }}: {{ lastTokenUsage.outputTokens }}</span>
      <span>{{ t('tokens.cost') }}: ${{ lastTokenUsage.cost.toFixed(4) }}</span>
      <span v-if="lastTokenUsage.tokensSaved > 0" class="text-green-400">
        {{ t('tokens.saved') }}: {{ lastTokenUsage.tokensSaved }}
      </span>
    </div>

    <!-- Error display -->
    <div v-if="error" class="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
      {{ error }}
    </div>

    <!-- Input -->
    <div v-if="!activeThread?.isReadOnly" class="border-t border-surface-800 bg-surface-900 p-3">
      <div class="flex gap-2">
        <textarea
          v-model="messageInput"
          :placeholder="t('chat.placeholder')"
          :disabled="isStreaming"
          class="input flex-1 resize-none font-mono text-sm"
          rows="2"
          @keydown="handleKeydown"
        />
        <UButton
          variant="primary"
          :disabled="!messageInput.trim() || isStreaming"
          :loading="isStreaming"
          @click="handleSend"
        >
          {{ isStreaming ? t('chat.stop') : t('chat.send') }}
        </UButton>
      </div>
    </div>

    <!-- System prompt editor -->
    <UDialog :open="showSystemPrompt" :title="t('thread.systemPrompt')" @close="showSystemPrompt = false">
      <div class="space-y-4">
        <UTextarea
          v-model="editingPrompt"
          :placeholder="t('thread.systemPromptPlaceholder')"
          :rows="6"
        />
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="showSystemPrompt = false">{{ t('common.cancel') }}</UButton>
          <UButton variant="primary" @click="handleSavePrompt">{{ t('common.save') }}</UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>
