<script setup lang="ts">
const props = defineProps<{
  threadId: string
  projectId: string
}>()

const { t } = useI18n()
const { activeThread, fetchThread, updateThread, generateSummary } = useThread()
const { messages, isStreaming, toolCalls, pendingApprovals, lastTokenUsage, error, loadMessages, sendMessage, approveTool, togglePin, clear } = useChat()
const { activeProject, updateProject } = useProject()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()
const showSystemPrompt = ref(false)
const editingPrompt = ref('')
const generatingSummary = ref(false)
const chatMode = ref<'plan' | 'agent'>('plan')

// Provider/Model selection
interface ProviderOption {
  provider: string
  name: string
  models: Array<{ id: string; name: string }>
}

const availableProviders = ref<ProviderOption[]>([])
const selectedProvider = ref('')
const selectedModel = ref('')

const providerNames: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'GPT',
  gemini: 'Gemini',
}

async function loadProviders() {
  try {
    const configs = await $fetch<Array<{
      provider: string
      isActive: boolean
      hasApiKey: boolean
      models: string[]
      availableModels: Array<{ id: string; name: string }>
    }>>('/api/providers')

    availableProviders.value = configs
      .filter(c => c.isActive && c.hasApiKey)
      .map(c => ({
        provider: c.provider,
        name: providerNames[c.provider] || c.provider,
        models: c.availableModels.filter(m => c.models.includes(m.id)),
      }))

    // Initialize selection from project defaults or first available
    const defaultProvider = activeProject.value?.settings?.defaultProvider
    const defaultModel = activeProject.value?.settings?.defaultModel

    if (defaultProvider && availableProviders.value.find(p => p.provider === defaultProvider)) {
      selectedProvider.value = defaultProvider
      selectedModel.value = defaultModel || availableProviders.value.find(p => p.provider === defaultProvider)?.models[0]?.id || ''
    } else if (availableProviders.value.length > 0) {
      selectedProvider.value = availableProviders.value[0].provider
      selectedModel.value = availableProviders.value[0].models[0]?.id || ''
    }
  } catch {}
}

const currentProviderModels = computed(() =>
  availableProviders.value.find(p => p.provider === selectedProvider.value)?.models || []
)

// When provider changes, auto-select first model
watch(selectedProvider, (newProvider) => {
  const models = availableProviders.value.find(p => p.provider === newProvider)?.models || []
  if (models.length > 0 && !models.find(m => m.id === selectedModel.value)) {
    selectedModel.value = models[0].id
  }
})

// Persist selection to project settings
watch([selectedProvider, selectedModel], async ([provider, model]) => {
  if (provider && model && activeProject.value) {
    const current = activeProject.value.settings
    if (current?.defaultProvider !== provider || current?.defaultModel !== model) {
      await updateProject(activeProject.value.id, {
        settings: { defaultProvider: provider, defaultModel: model },
      }).catch(() => {})
    }
  }
})

loadProviders()

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
    selectedProvider.value || undefined,
    selectedModel.value || undefined,
    chatMode.value,
  )
}

async function handleApprove(toolCallId: string, approved: boolean) {
  await approveTool(props.threadId, toolCallId, approved)
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
    <div v-if="toolCalls.length > 0" class="border-b border-surface-800 px-4 py-2 space-y-1.5">
      <div v-for="tc in toolCalls" :key="tc.id" class="rounded-lg bg-surface-800/50 px-3 py-2 text-xs">
        <div class="flex items-center gap-2">
          <svg class="h-3.5 w-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.01-2.87a1.85 1.85 0 010-3.22l5.01-2.87a3.69 3.69 0 013.56 0l5.01 2.87a1.85 1.85 0 010 3.22l-5.01 2.87a3.69 3.69 0 01-3.56 0z" />
          </svg>
          <span class="font-mono text-amber-400">{{ tc.name }}</span>
          <span v-if="tc.input?.path" class="text-surface-500 font-mono truncate">{{ tc.input.path }}</span>

          <!-- Status indicators -->
          <span v-if="tc.rejected" class="text-red-400 font-medium">✗ {{ t('chat.rejected') }}</span>
          <span v-else-if="tc.result && !tc.pending" :class="tc.isError ? 'text-red-400' : 'text-green-400'" class="font-medium">
            {{ tc.isError ? '✗ error' : '✓ done' }}
          </span>
          <span v-else-if="tc.pending" class="text-amber-400">⏳ {{ t('chat.awaitingApproval') }}</span>
          <span v-else class="text-surface-500 animate-pulse">{{ t('chat.thinking') }}</span>
        </div>

        <!-- Approval buttons for pending write operations -->
        <div v-if="tc.pending && !tc.rejected && !tc.result?.startsWith('✓')" class="mt-2 flex items-center gap-2 border-t border-surface-700 pt-2">
          <span class="text-surface-400 flex-1">{{ t('chat.approvalPrompt', { tool: tc.name, path: String(tc.input?.path || '') }) }}</span>
          <UButton variant="primary" size="sm" @click="handleApprove(tc.id, true)">
            {{ t('chat.approve') }}
          </UButton>
          <UButton variant="danger" size="sm" @click="handleApprove(tc.id, false)">
            {{ t('chat.reject') }}
          </UButton>
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
      <!-- Mode + Provider/Model selector -->
      <div class="mb-2 flex items-center gap-2 flex-wrap">
        <!-- Chat mode toggle -->
        <div class="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
          <button
            class="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
            :class="chatMode === 'plan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'"
            @click="chatMode = 'plan'"
            :title="t('chat.planDesc')"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {{ t('chat.planMode') }}
          </button>
          <button
            class="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
            :class="chatMode === 'agent'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'"
            @click="chatMode = 'agent'"
            :title="t('chat.agentDesc')"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.01-2.87a1.85 1.85 0 010-3.22l5.01-2.87a3.69 3.69 0 013.56 0l5.01 2.87a1.85 1.85 0 010 3.22l-5.01 2.87a3.69 3.69 0 01-3.56 0z" />
            </svg>
            {{ t('chat.agentMode') }}
          </button>
        </div>

        <div class="h-4 w-px bg-surface-700" />

        <!-- Provider/Model selector -->
        <template v-if="availableProviders.length > 0">
          <div class="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            <button
              v-for="p in availableProviders"
              :key="p.provider"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
              :class="selectedProvider === p.provider
                ? 'bg-accent text-white shadow-sm'
                : 'text-surface-400 hover:text-surface-200'"
              @click="selectedProvider = p.provider"
            >
              {{ p.name }}
            </button>
          </div>
          <select
            v-model="selectedModel"
            class="rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-300 focus:border-accent focus:outline-none cursor-pointer"
          >
            <option
              v-for="m in currentProviderModels"
              :key="m.id"
              :value="m.id"
            >
              {{ m.name }}
            </option>
          </select>
        </template>
        <NuxtLink v-else to="/settings" class="text-xs text-accent hover:underline">
          {{ t('chat.configureProvider') }}
        </NuxtLink>
      </div>

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
