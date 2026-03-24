<script setup lang="ts">
const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  selectThread: [id: string]
}>()

const { t } = useI18n()
const { threadTree, threads, fetchThreads, createThread, deleteThread, activeThreadId } = useThread()
const showCreate = ref(false)
const newThreadParentId = ref<string | null>(null)
const newThreadTitle = ref('')
const newThreadPrompt = ref('')

await fetchThreads(props.projectId)

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
      <button
        class="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
        @click="openCreateDialog()"
        :title="t('thread.create')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
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
          <UButton variant="primary" @click="handleCreate">{{ t('common.save') }}</UButton>
        </div>
      </form>
    </UDialog>
  </div>
</template>
