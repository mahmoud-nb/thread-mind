<script setup lang="ts">
const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  selectThread: [id: string]
}>()

const { t } = useI18n()
const { threadTree, threads, fetchThreads, createThread, deleteThread, activeThreadId } = useThread()
const { activeProject } = useProject()
const showCreate = ref(false)
const newThreadParentId = ref<string | null>(null)
const newThreadTitle = ref('')
const newThreadPrompt = ref('')
const syncing = ref(false)
const syncResult = ref<{ imported: number; updated: number } | null>(null)

const isTeamMode = computed(() => activeProject.value?.workMode === 'team')

await fetchThreads(props.projectId)

async function handleSync() {
  syncing.value = true
  syncResult.value = null
  try {
    const result = await $fetch<{ imported: number; updated: number }>('/api/sync/import', {
      method: 'POST',
      body: { projectId: props.projectId },
    })
    syncResult.value = result
    await fetchThreads(props.projectId)
    // Clear result after 3s
    setTimeout(() => { syncResult.value = null }, 3000)
  } catch {} finally {
    syncing.value = false
  }
}

function openCreateDialog(parentId?: string) {
  newThreadParentId.value = parentId || null
  newThreadTitle.value = ''
  newThreadPrompt.value = ''
  showCreate.value = true
}

async function handleCreate() {
  if (!newThreadTitle.value) return
  const thread = await createThread({
    projectId: props.projectId,
    parentId: newThreadParentId.value || undefined,
    title: newThreadTitle.value,
    systemPrompt: newThreadPrompt.value || undefined,
  }) as { id: string }
  showCreate.value = false
  emit('selectThread', thread.id)
}

async function handleDelete(id: string) {
  if (confirm(t('thread.deleteConfirm'))) {
    await deleteThread(id)
  }
}

function handleSelect(id: string) {
  emit('selectThread', id)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-800 px-3 py-2">
      <span class="text-xs font-medium uppercase tracking-wider text-surface-500">{{ t('thread.title') }}</span>
      <div class="flex items-center gap-0.5">
        <button
          v-if="isTeamMode"
          class="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300 cursor-pointer"
          :class="{ 'animate-spin': syncing }"
          :disabled="syncing"
          @click="handleSync"
          :title="t('sync.sync')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
        <button
          class="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300 cursor-pointer"
          @click="openCreateDialog()"
          :title="t('thread.create')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Sync result toast -->
    <div v-if="syncResult" class="mx-2 mt-1 rounded bg-green-500/10 px-2 py-1 text-xs text-green-400 text-center">
      {{ t('sync.syncResult', syncResult) }}
    </div>

    <!-- Tree -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="threadTree.length === 0" class="py-8 text-center">
        <p class="text-xs text-surface-500">{{ t('thread.noThreads') }}</p>
        <UButton variant="ghost" size="sm" class="mt-2" @click="openCreateDialog()">
          {{ t('thread.create') }}
        </UButton>
      </div>
      <ThreadNode
        v-for="thread in threadTree"
        :key="thread.id"
        :thread="thread"
        :active-id="activeThreadId"
        @select="handleSelect"
        @create-child="openCreateDialog"
        @delete="handleDelete"
      />
    </div>

    <!-- Create dialog -->
    <UDialog :open="showCreate" :title="newThreadParentId ? t('thread.createSub') : t('thread.create')" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="handleCreate">
        <UInput
          v-model="newThreadTitle"
          :label="t('thread.threadTitle')"
          :placeholder="t('thread.threadTitle')"
          autofocus
        />
        <UTextarea
          v-model="newThreadPrompt"
          :label="t('thread.systemPrompt')"
          :placeholder="t('thread.systemPromptPlaceholder')"
          :rows="4"
        />
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" @click="showCreate = false">{{ t('common.cancel') }}</UButton>
          <UButton type="submit" variant="primary">{{ t('common.save') }}</UButton>
        </div>
      </form>
    </UDialog>
  </div>
</template>
