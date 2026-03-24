<script setup lang="ts">
interface Props {
  minLeft?: number
  minRight?: number
  defaultLeft?: number
}

const props = withDefaults(defineProps<Props>(), {
  minLeft: 200,
  minRight: 200,
  defaultLeft: 280,
})

const containerRef = ref<HTMLElement>()
const leftWidth = ref(props.defaultLeft)
const isDragging = ref(false)

function onMouseDown() {
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const newWidth = e.clientX - rect.left
  const max = rect.width - props.minRight
  leftWidth.value = Math.max(props.minLeft, Math.min(max, newWidth))
}

function onMouseUp() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="flex h-full overflow-hidden">
    <div :style="{ width: `${leftWidth}px`, minWidth: `${minLeft}px` }" class="flex-shrink-0 overflow-hidden">
      <slot name="left" />
    </div>
    <div
      class="w-1 flex-shrink-0 cursor-col-resize bg-surface-800 hover:bg-accent/50 transition-colors"
      :class="{ 'bg-accent/50': isDragging }"
      @mousedown.prevent="onMouseDown"
    />
    <div class="flex-1 overflow-hidden">
      <slot name="right" />
    </div>
  </div>
</template>
