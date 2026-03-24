<script setup lang="ts">
interface DropdownItem {
  key: string
  label: string
  icon?: string
  danger?: boolean
  divider?: boolean
}

interface Props {
  items: DropdownItem[]
}

defineProps<Props>()
const emit = defineEmits<{ select: [key: string] }>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

function toggle() {
  isOpen.value = !isOpen.value
}

function select(key: string) {
  isOpen.value = false
  emit('select', key)
}

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <div @click="toggle">
      <slot name="trigger" />
    </div>
    <Transition
      enter-active-class="duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-40 mt-1 min-w-[160px] rounded-lg border border-surface-700 bg-surface-900 py-1 shadow-xl"
      >
        <template v-for="item in items" :key="item.key">
          <div v-if="item.divider" class="my-1 border-t border-surface-700" />
          <button
            v-else
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
            :class="item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-surface-300 hover:bg-surface-800'"
            @click="select(item.key)"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
