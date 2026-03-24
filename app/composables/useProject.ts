interface Project {
  id: string
  name: string
  targetPath: string
  workMode: 'solo' | 'team'
  createdAt: string
  updatedAt: string
  settings?: {
    defaultProvider?: string
    defaultModel?: string
    language?: string
    customPrompt?: string
  }
}

const activeProjectId = ref<string | null>(null)

export function useProject() {
  const projects = ref<Project[]>([])
  const loading = ref(false)

  const activeProject = computed(() =>
    projects.value.find(p => p.id === activeProjectId.value) || null
  )

  async function fetchProjects() {
    loading.value = true
    try {
      projects.value = await $fetch('/api/projects')
    } finally {
      loading.value = false
    }
  }

  async function createProject(data: { name: string; targetPath: string; workMode: 'solo' | 'team' }) {
    const project = await $fetch('/api/projects', {
      method: 'POST',
      body: data,
    })
    projects.value.push(project as Project)
    activeProjectId.value = (project as Project).id
    return project
  }

  async function updateProject(id: string, data: Partial<Project & { settings: Partial<Project['settings']> }>) {
    const updated = await $fetch(`/api/projects/${id}`, {
      method: 'PUT',
      body: data,
    })
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = updated as Project
    return updated
  }

  async function deleteProject(id: string) {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    projects.value = projects.value.filter(p => p.id !== id)
    if (activeProjectId.value === id) {
      activeProjectId.value = projects.value[0]?.id || null
    }
  }

  function setActiveProject(id: string | null) {
    activeProjectId.value = id
  }

  return {
    projects,
    activeProject,
    activeProjectId,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
  }
}
