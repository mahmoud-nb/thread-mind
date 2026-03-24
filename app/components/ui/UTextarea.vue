<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  rows?: number
  autoResize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  autoResize: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaRef = ref<HTMLTextAreaElement>()

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  if (props.autoResize) {
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`
  }
}
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-xs font-medium text-surface-400">
      {{ label }}
    </label>
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="input resize-none"
      @input="onInput"
    />
  </div>
</template>
