<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: boolean
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  icon: false,
  loading: false,
  disabled: false,
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants: Record<string, string> = {
    primary: 'bg-accent hover:bg-accent-600 text-white',
    secondary: 'bg-surface-800 hover:bg-surface-700 text-surface-200',
    ghost: 'hover:bg-surface-800 text-surface-400 hover:text-surface-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  const sizes: Record<string, string> = props.icon
    ? { sm: 'p-1.5 text-xs', md: 'p-2 text-sm', lg: 'p-3 text-base' }
    : { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-base' }

  return [base, variants[props.variant], sizes[props.size]].join(' ')
})
</script>

<template>
  <button :class="classes" :disabled="disabled || loading">
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
