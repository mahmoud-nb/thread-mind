<script setup lang="ts">
interface ThreadItem {
  id: string
  parentId: string | null
  title: string
  status: string
  isReadOnly: boolean
  _count?: { messages: number; children: number }
  children: ThreadItem[]
}

const props = defineProps<{
  thread: ThreadItem
  activeId: string | null
  depth?: number
}>()

const emit = defineEmits<{
  select: [id: string]
  createChild: [parentId: string]
  delete: [id: string]
}>()

const { t } = useI18n()
const isExpanded = ref(true)
const showMenu = ref(false)
const depth = props.depth || 0

const statusColors: Record<string, string> = {
  active: 'bg-green-400',
  resolved: 'bg-blue-400',
  archived: 'bg-surface-500',
}
</script>

<template>
  <div>
    <div
      class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors cursor-pointer"
      :class="[
        activeId === thread.id ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
      ]"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
      @click="emit('select', thread.id)"
    >
      <!-- Expand toggle -->
      <button
        v-if="thread.children.length > 0"
        class="flex-shrink-0 p-0.5 hover:text-surface-200"
        @click.stop="isExpanded = !isExpanded"
      >
        <svg
          class="h-3 w-3 transition-transform"
          :class="{ 'rotate-90': isExpanded }"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
        </svg>
      </button>
      <div v-else class="w-4 flex-shrink-0" />

      <!-- Status dot -->
      <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full" :class="statusColors[thread.status] || statusColors.active" />

      <!-- Title -->
      <span class="flex-1 truncate">{{ thread.title }}</span>

      <!-- Read-only badge -->
      <svg v-if="thread.isReadOnly" class="h-3 w-3 flex-shrink-0 text-surface-600" viewBox="0 0 20 20" fill="currentColor" :title="t('thread.readOnly')">
        <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
      </svg>

      <!-- Actions -->
      <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <UDropdown
          :items="[
            { key: 'add', label: t('thread.createSub') },
            ...(thread.isReadOnly ? [] : [
              { key: 'divider', label: '', divider: true },
              { key: 'delete', label: t('thread.delete'), danger: true },
            ]),
          ]"
          @select="(key: string) => key === 'add' ? emit('createChild', thread.id) : key === 'delete' ? emit('delete', thread.id) : null"
        >
          <template #trigger>
            <button class="rounded p-0.5 hover:bg-surface-600">
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5.5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm7-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </button>
          </template>
        </UDropdown>
      </div>
    </div>

    <!-- Children -->
    <div v-if="isExpanded && thread.children.length > 0">
      <ThreadNode
        v-for="child in thread.children"
        :key="child.id"
        :thread="child"
        :active-id="activeId"
        :depth="depth + 1"
        @select="emit('select', $event)"
        @create-child="emit('createChild', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>
