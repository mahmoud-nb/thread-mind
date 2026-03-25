<script setup lang="ts">
const { t } = useI18n()
const { projects, fetchProjects, createProject, updateProject, deleteProject, loading } = useProject()
const showCreate = ref(false)
const showEdit = ref(false)
const showDeleteConfirm = ref(false)
const newProject = reactive({ name: '', targetPath: '', workMode: 'solo' as 'solo' | 'team' })
const editingProject = reactive({ id: '', name: '', targetPath: '', workMode: 'solo' as 'solo' | 'team' })
const deletingProject = ref<{ id: string; name: string } | null>(null)
const deleting = ref(false)

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

function openEdit(project: { id: string; name: string; targetPath: string; workMode: string }) {
  editingProject.id = project.id
  editingProject.name = project.name
  editingProject.targetPath = project.targetPath
  editingProject.workMode = project.workMode as 'solo' | 'team'
  showEdit.value = true
}

async function handleEdit() {
  if (!editingProject.name || !editingProject.targetPath) return
  await updateProject(editingProject.id, {
    name: editingProject.name,
    targetPath: editingProject.targetPath,
    workMode: editingProject.workMode,
  })
  showEdit.value = false
}

function openDelete(project: { id: string; name: string }) {
  deletingProject.value = project
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingProject.value) return
  deleting.value = true
  try {
    await deleteProject(deletingProject.value.id)
    showDeleteConfirm.value = false
    deletingProject.value = null
  } finally {
    deleting.value = false
  }
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
      <div
        v-for="project in projects"
        :key="project.id"
        class="card flex items-center justify-between hover:border-surface-600 transition-colors group"
      >
        <NuxtLink
          :to="`/projects/${project.id}`"
          class="flex-1 min-w-0 cursor-pointer"
        >
          <h3 class="font-medium text-surface-100">{{ project.name }}</h3>
          <p class="mt-1 text-xs text-surface-500 font-mono truncate">{{ project.targetPath }}</p>
        </NuxtLink>

        <div class="flex items-center gap-2 ml-4">
          <UBadge :variant="project.workMode === 'team' ? 'info' : 'active'">
            {{ t(`project.${project.workMode}`) }}
          </UBadge>

          <!-- Actions (visible on hover) -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <!-- Edit button -->
            <button
              class="rounded-md p-1.5 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors cursor-pointer"
              :title="t('project.edit')"
              @click.stop="openEdit(project)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>

            <!-- Delete button -->
            <button
              class="rounded-md p-1.5 text-surface-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
              :title="t('project.delete')"
              @click.stop="openDelete(project)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
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
          <UButton type="submit" variant="primary">{{ t('project.create') }}</UButton>
        </div>
      </form>
    </UDialog>

    <!-- Edit dialog -->
    <UDialog :open="showEdit" :title="t('project.edit')" @close="showEdit = false">
      <form class="space-y-4" @submit.prevent="handleEdit">
        <UInput
          v-model="editingProject.name"
          :label="t('project.name')"
          :placeholder="t('project.name')"
        />
        <UInput
          v-model="editingProject.targetPath"
          :label="t('project.targetPath')"
          placeholder="/path/to/your/project"
        />
        <div class="space-y-1">
          <label class="block text-xs font-medium text-surface-400">{{ t('project.workMode') }}</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="card text-left transition-colors cursor-pointer"
              :class="editingProject.workMode === 'solo' ? 'border-accent bg-accent/5' : ''"
              @click="editingProject.workMode = 'solo'"
            >
              <span class="text-sm font-medium text-surface-200">{{ t('project.solo') }}</span>
              <p class="mt-1 text-xs text-surface-500">{{ t('project.soloDesc') }}</p>
            </button>
            <button
              type="button"
              class="card text-left transition-colors cursor-pointer"
              :class="editingProject.workMode === 'team' ? 'border-accent bg-accent/5' : ''"
              @click="editingProject.workMode = 'team'"
            >
              <span class="text-sm font-medium text-surface-200">{{ t('project.team') }}</span>
              <p class="mt-1 text-xs text-surface-500">{{ t('project.teamDesc') }}</p>
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" @click="showEdit = false">{{ t('common.cancel') }}</UButton>
          <UButton type="submit" variant="primary">{{ t('common.save') }}</UButton>
        </div>
      </form>
    </UDialog>

    <!-- Delete confirmation dialog -->
    <UDialog :open="showDeleteConfirm" :title="t('project.delete')" @close="showDeleteConfirm = false">
      <div class="space-y-4">
        <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p class="text-sm text-surface-200">
            {{ t('project.deleteWarning', { name: deletingProject?.name || '' }) }}
          </p>
          <ul class="mt-3 space-y-1 text-xs text-surface-400">
            <li class="flex items-center gap-1.5">
              <span class="text-red-400">&#x2022;</span>
              {{ t('project.deleteThreads') }}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-red-400">&#x2022;</span>
              {{ t('project.deleteMessages') }}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-red-400">&#x2022;</span>
              {{ t('project.deleteMarkdown') }}
            </li>
          </ul>
        </div>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="showDeleteConfirm = false">{{ t('common.cancel') }}</UButton>
          <UButton variant="danger" :loading="deleting" @click="handleDelete">
            {{ t('project.confirmDelete') }}
          </UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>
