<script setup lang="ts">
const { t } = useI18n()
const { projects, fetchProjects, createProject, deleteProject, loading } = useProject()
const showCreate = ref(false)
const newProject = reactive({ name: '', targetPath: '', workMode: 'solo' as 'solo' | 'team' })

await fetchProjects()

async function handleCreate() {
  if (!newProject.name || !newProject.targetPath) return
  const project = await createProject({ ...newProject }) as { id: string }
  showCreate.value = false
  newProject.name = ''
  newProject.targetPath = ''
  newProject.workMode = 'solo'
  navigateTo(`/projects/${project.id}`)
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-surface-100">{{ t('project.title') }}</h1>
      <UButton variant="primary" @click="showCreate = true">
        {{ t('project.create') }}
      </UButton>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && projects.length === 0" class="card py-16 text-center">
      <p class="text-surface-400">{{ t('project.noProjects') }}</p>
    </div>

    <!-- Project list -->
    <div class="space-y-3">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="card flex items-center justify-between hover:border-surface-600 transition-colors cursor-pointer block"
      >
        <div>
          <h3 class="font-medium text-surface-100">{{ project.name }}</h3>
          <p class="mt-1 text-xs text-surface-500 font-mono">{{ project.targetPath }}</p>
        </div>
        <UBadge :variant="project.workMode === 'team' ? 'info' : 'active'">
          {{ t(`project.${project.workMode}`) }}
        </UBadge>
      </NuxtLink>
    </div>

    <!-- Create dialog -->
    <UDialog :open="showCreate" :title="t('project.create')" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="handleCreate">
        <UInput
          v-model="newProject.name"
          :label="t('project.name')"
          :placeholder="t('project.name')"
        />
        <UInput
          v-model="newProject.targetPath"
          :label="t('project.targetPath')"
          placeholder="/path/to/your/project"
        />
        <div class="space-y-1">
          <label class="block text-xs font-medium text-surface-400">{{ t('project.workMode') }}</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="card text-left transition-colors cursor-pointer"
              :class="newProject.workMode === 'solo' ? 'border-accent bg-accent/5' : ''"
              @click="newProject.workMode = 'solo'"
            >
              <span class="text-sm font-medium text-surface-200">{{ t('project.solo') }}</span>
              <p class="mt-1 text-xs text-surface-500">{{ t('project.soloDesc') }}</p>
            </button>
            <button
              type="button"
              class="card text-left transition-colors cursor-pointer"
              :class="newProject.workMode === 'team' ? 'border-accent bg-accent/5' : ''"
              @click="newProject.workMode = 'team'"
            >
              <span class="text-sm font-medium text-surface-200">{{ t('project.team') }}</span>
              <p class="mt-1 text-xs text-surface-500">{{ t('project.teamDesc') }}</p>
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" @click="showCreate = false">{{ t('common.cancel') }}</UButton>
          <UButton variant="primary" @click="handleCreate">{{ t('project.create') }}</UButton>
        </div>
      </form>
    </UDialog>
  </div>
</template>
