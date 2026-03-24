<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const route = useRoute()
const { totals, fetchUsage } = useTokenTracker()
const { activeProject } = useProject()

watch(activeProject, (p) => {
  if (p) fetchUsage(p.id)
}, { immediate: true })
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
