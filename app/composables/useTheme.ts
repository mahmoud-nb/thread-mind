export type ThemeMode = 'light' | 'dark' | 'system'

const theme = ref<ThemeMode>('dark')
const resolvedTheme = ref<'light' | 'dark'>('dark')

let mediaQuery: MediaQueryList | null = null

function applyTheme(mode: 'light' | 'dark') {
  resolvedTheme.value = mode
  if (import.meta.client) {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (!import.meta.client) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function onSystemChange(e: MediaQueryListEvent) {
  if (theme.value === 'system') {
    applyTheme(e.matches ? 'dark' : 'light')
  }
}

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    theme.value = mode

    if (import.meta.client) {
      localStorage.setItem('threadmind-theme', mode)
    }

    if (mode === 'system') {
      applyTheme(resolveSystemTheme())
    } else {
      applyTheme(mode)
    }
  }

  function initTheme() {
    if (!import.meta.client) return

    // Read from localStorage
    const stored = localStorage.getItem('threadmind-theme') as ThemeMode | null
    const initial = stored || 'dark'

    // Listen for system theme changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', onSystemChange)

    setTheme(initial)
  }

  const isDark = computed(() => resolvedTheme.value === 'dark')

  function toggleTheme() {
    if (theme.value === 'dark') {
      setTheme('light')
    } else if (theme.value === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  return {
    theme: readonly(theme),
    resolvedTheme: readonly(resolvedTheme),
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  }
}
