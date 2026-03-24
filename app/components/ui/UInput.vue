<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  label?: string
  error?: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-xs font-medium text-surface-400">
      {{ label }}
    </label>
    <input
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
