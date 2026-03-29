import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const fileExplorerOpen = ref(false)
  const docPanelOpen = ref(false)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function toggleFileExplorer() {
    fileExplorerOpen.value = !fileExplorerOpen.value
    if (fileExplorerOpen.value) docPanelOpen.value = false
  }

  function toggleDocPanel() {
    docPanelOpen.value = !docPanelOpen.value
    if (docPanelOpen.value) fileExplorerOpen.value = false
  }

  return {
    sidebarOpen,
    fileExplorerOpen,
    docPanelOpen,
    toggleSidebar,
    toggleFileExplorer,
    toggleDocPanel,
  }
})
