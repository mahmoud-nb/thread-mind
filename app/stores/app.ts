import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const fileExplorerOpen = ref(false)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function toggleFileExplorer() {
    fileExplorerOpen.value = !fileExplorerOpen.value
  }

  return {
    sidebarOpen,
    fileExplorerOpen,
    toggleSidebar,
    toggleFileExplorer,
  }
})
