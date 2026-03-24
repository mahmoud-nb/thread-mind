<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const projectId = route.params.projectId as string
const appStore = useAppStore()
const { setActiveProject, fetchProjects, activeProject } = useProject()
const { activeThreadId, fetchThread, setActiveThread } = useThread()

await fetchProjects()
setActiveProject(projectId)

async function handleSelectThread(threadId: string) {
  setActiveThread(threadId)
  await fetchThread(threadId)
}
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <!-- Thread sidebar -->
    <div
      v-if="appStore.sidebarOpen"
      class="w-64 flex-shrink-0 border-r border-surface-800 bg-surface-900"
    >
      <ThreadTree
        :project-id="projectId"
        @select-thread="handleSelectThread"
      />
    </div>

    <!-- Sidebar toggle (when closed) -->
    <button
      v-if="!appStore.sidebarOpen"
      class="flex-shrink-0 border-r border-surface-800 bg-surface-900 px-1 hover:bg-surface-800"
      @click="appStore.toggleSidebar()"
    >
      <svg class="h-4 w-4 text-surface-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Main chat area -->
    <div class="flex-1 overflow-hidden">
      <ChatPanel
        v-if="activeThreadId"
        :thread-id="activeThreadId"
        :project-id="projectId"
      />
      <div v-else class="flex h-full items-center justify-center">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-surface-700" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <p class="mt-3 text-sm text-surface-500">{{ t('chat.noMessages') }}</p>
          <p class="mt-1 text-xs text-surface-600">{{ t('thread.noThreads') }}</p>
        </div>
      </div>
    </div>

    <!-- File explorer panel -->
    <div
      v-if="appStore.fileExplorerOpen"
      class="w-72 flex-shrink-0 border-l border-surface-800 bg-surface-900"
    >
      <FileExplorer :project-id="projectId" />
    </div>

    <!-- File explorer toggle -->
    <button
      class="flex-shrink-0 border-l border-surface-800 bg-surface-900 px-1 hover:bg-surface-800"
      @click="appStore.toggleFileExplorer()"
      :title="t('files.title')"
    >
      <svg class="h-4 w-4 text-surface-500" :class="{ 'text-accent': appStore.fileExplorerOpen }" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
</template>
