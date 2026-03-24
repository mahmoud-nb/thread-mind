<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'max-w-lg',
})
const emit = defineEmits<{ close: [] }>()

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click="onBackdropClick"
  >
    <div :class="['card w-full shadow-2xl', maxWidth]">
      <div v-if="title" class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-surface-100">{{ title }}</h2>
        <button
          class="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
