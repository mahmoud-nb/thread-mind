<script setup lang="ts">
const { t } = useI18n()
const { projects, fetchProjects } = useProject()

await fetchProjects()

const hasProjects = computed(() => projects.value.length > 0)
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <div class="text-center max-w-md">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <svg class="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-surface-100">{{ t('app.name') }}</h1>
      <p class="mt-2 text-surface-400">{{ t('app.tagline') }}</p>

      <div class="mt-8 flex flex-col items-center gap-3">
        <!-- Existing projects: go to project list -->
        <NuxtLink v-if="hasProjects" to="/projects" class="btn-primary">
          {{ t('nav.projects') }}
        </NuxtLink>

        <!-- Quick access to recent project -->
        <NuxtLink
          v-for="project in projects.slice(0, 3)"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="btn-secondary w-64 justify-between"
        >
          <span class="truncate">{{ project.name }}</span>
          <svg class="h-4 w-4 flex-shrink-0 text-surface-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </NuxtLink>

        <!-- No projects: create one -->
        <NuxtLink v-if="!hasProjects" to="/projects" class="btn-primary">
          {{ t('nav.newProject') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
