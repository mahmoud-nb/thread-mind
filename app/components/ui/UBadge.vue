<script setup lang="ts">
interface Props {
  variant?: 'active' | 'resolved' | 'archived' | 'info' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
})

const classes = computed(() => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const variants: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    resolved: 'bg-blue-500/10 text-blue-400',
    archived: 'bg-surface-700 text-surface-400',
    info: 'bg-accent/10 text-accent-400',
    warning: 'bg-amber-500/10 text-amber-400',
  }
  return [base, variants[props.variant]].join(' ')
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
