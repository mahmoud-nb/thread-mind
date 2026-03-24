<script setup lang="ts">
interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
})
const emit = defineEmits<{ close: [] }>()

const icons: Record<string, string> = {
  success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
}

const colors: Record<string, string> = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-accent/30 bg-accent/10 text-accent-300',
}

let timeout: ReturnType<typeof setTimeout>
watchEffect(() => {
  if (props.visible) {
    clearTimeout(timeout)
    timeout = setTimeout(() => emit('close'), 3000)
  }
})
</script>

<template>
  <Transition
    enter-active-class="duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="visible"
      :class="['fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg', colors[type]]"
    >
      <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" :d="icons[type]" />
      </svg>
      <span class="text-sm">{{ message }}</span>
      <button class="ml-2 opacity-60 hover:opacity-100" @click="emit('close')">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
