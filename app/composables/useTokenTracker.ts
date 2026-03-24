interface TokenTotals {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  tokensSaved: number
  requestCount: number
}

export function useTokenTracker() {
  const totals = ref<TokenTotals | null>(null)
  const loading = ref(false)

  async function fetchUsage(projectId: string, threadId?: string) {
    loading.value = true
    try {
      const result = await $fetch('/api/tokens/usage', {
        params: { projectId, ...(threadId && { threadId }) },
      }) as { totals: TokenTotals }
      totals.value = result.totals
    } finally {
      loading.value = false
    }
  }

  const formattedCost = computed(() => {
    if (!totals.value) return '$0.00'
    return `$${totals.value.estimatedCost.toFixed(4)}`
  })

  const formattedSaved = computed(() => {
    if (!totals.value || !totals.value.tokensSaved) return '0'
    const k = totals.value.tokensSaved / 1000
    return k >= 1 ? `${k.toFixed(1)}K` : `${totals.value.tokensSaved}`
  })

  return {
    totals,
    loading,
    fetchUsage,
    formattedCost,
    formattedSaved,
  }
}
