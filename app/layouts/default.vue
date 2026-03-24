<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const route = useRoute()
const { totals, fetchUsage } = useTokenTracker()
const { activeProject } = useProject()
const { theme, isDark, setTheme } = useTheme()

watch(activeProject, (p) => {
  if (p) fetchUsage(p.id)
}, { immediate: true })

const themeIcon = computed(() => {
  if (theme.value === 'dark') return 'dark'
  if (theme.value === 'light') return 'light'
  return 'system'
})
</script>

<template>
  <div class="flex h-screen flex-col bg-surface-950">
    <!-- Top Bar -->
    <header class="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-800 bg-surface-900 px-4">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="text-sm font-bold text-accent">
          {{ t('app.name') }}
        </NuxtLink>
        <span v-if="activeProject" class="text-xs text-surface-500">/</span>
        <span v-if="activeProject" class="text-xs text-surface-300">{{ activeProject.name }}</span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Token badge -->
        <div v-if="totals" class="flex items-center gap-1.5 rounded-md bg-surface-800 px-2.5 py-1 text-xs">
          <svg class="h-3.5 w-3.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span class="text-surface-300">{{ (totals.totalTokens / 1000).toFixed(1) }}K</span>
          <span v-if="totals.tokensSaved > 0" class="text-green-400">(-{{ (totals.tokensSaved / 1000).toFixed(1) }}K)</span>
        </div>

        <!-- Theme toggle -->
        <button
          class="btn-ghost btn-sm flex items-center gap-1"
          :title="t('settings.theme')"
          @click="setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')"
        >
          <!-- Sun icon (light) -->
          <svg v-if="themeIcon === 'light'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          <!-- Moon icon (dark) -->
          <svg v-else-if="themeIcon === 'dark'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
          <!-- System icon -->
          <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        </button>

        <!-- Language switcher -->
        <button
          class="btn-ghost btn-sm"
          @click="setLocale(locale === 'en' ? 'fr' : 'en')"
        >
          {{ locale === 'en' ? 'FR' : 'EN' }}
        </button>

        <!-- Settings -->
        <NuxtLink to="/settings" class="btn-ghost btn-sm">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </NuxtLink>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>
