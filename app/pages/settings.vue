<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { theme, setTheme } = useTheme()
const { activeProject, updateProject } = useProject()

interface ProviderDisplay {
  provider: string
  name: string
  color: string
  isActive: boolean
  hasApiKey: boolean
  models: string[]
  availableModels: Array<{ id: string; name: string }>
}

const providers = ref<ProviderDisplay[]>([])
const apiKeys = reactive<Record<string, string>>({})
const selectedModels = reactive<Record<string, string[]>>({})
const testResults = reactive<Record<string, boolean | null>>({})
const saving = ref<Record<string, boolean>>({})
const toast = ref({ visible: false, message: '', type: 'success' as 'success' | 'error' })

async function loadProviders() {
  try {
    providers.value = await $fetch('/api/providers')
    for (const p of providers.value) {
      selectedModels[p.provider] = p.models || []
      if (!apiKeys[p.provider]) apiKeys[p.provider] = ''
      testResults[p.provider] = null
    }
  } catch {}
}

function toggleModel(providerKey: string, modelId: string) {
  const current = selectedModels[providerKey] || []
  if (current.includes(modelId)) {
    selectedModels[providerKey] = current.filter(m => m !== modelId)
  } else {
    selectedModels[providerKey] = [...current, modelId]
  }
}

async function testConnection(provider: string) {
  testResults[provider] = null
  try {
    const result = await $fetch('/api/providers/test', {
      method: 'POST',
      body: { provider, apiKey: apiKeys[provider] },
    }) as { success: boolean }
    testResults[provider] = result.success
  } catch {
    testResults[provider] = false
  }
}

async function saveProvider(providerKey: string) {
  saving.value[providerKey] = true
  try {
    const models = selectedModels[providerKey]?.length > 0
      ? selectedModels[providerKey]
      : [providers.value.find(p => p.provider === providerKey)?.availableModels[0]?.id].filter(Boolean)
    if (models.length > 0) selectedModels[providerKey] = models as string[]

    await $fetch('/api/providers', {
      method: 'POST',
      body: {
        provider: providerKey,
        apiKey: apiKeys[providerKey],
        models,
        isActive: true,
      },
    })

    if (activeProject.value) {
      const hasDefault = activeProject.value.settings?.defaultProvider && activeProject.value.settings?.defaultModel
      if (!hasDefault && models.length > 0) {
        await updateProject(activeProject.value.id, {
          settings: { defaultProvider: providerKey, defaultModel: models[0] as string },
        })
      }
    }

    toast.value = { visible: true, message: t('settings.saved'), type: 'success' }
    await loadProviders()
  } catch {
    toast.value = { visible: true, message: t('common.error'), type: 'error' }
  } finally {
    saving.value[providerKey] = false
  }
}

async function disableProvider(providerKey: string) {
  try {
    await $fetch('/api/providers', {
      method: 'POST',
      body: {
        provider: providerKey,
        apiKey: '',
        models: [],
        isActive: false,
      },
    })
    apiKeys[providerKey] = ''
    selectedModels[providerKey] = []
    toast.value = { visible: true, message: t('settings.providerDisabled'), type: 'success' }
    await loadProviders()
  } catch {
    toast.value = { visible: true, message: t('common.error'), type: 'error' }
  }
}

await loadProviders()
</script>

<template>
  <div class="mx-auto max-w-3xl p-8">
    <div class="flex items-center gap-3 mb-8">
      <NuxtLink to="/" class="btn-ghost btn-sm">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-surface-100">{{ t('settings.title') }}</h1>
    </div>

    <!-- Language -->
    <section class="card mb-6">
      <h2 class="text-sm font-medium text-surface-300 mb-3">{{ t('settings.language') }}</h2>
      <div class="flex gap-2">
        <UButton :variant="locale === 'en' ? 'primary' : 'secondary'" size="sm" @click="setLocale('en')">English</UButton>
        <UButton :variant="locale === 'fr' ? 'primary' : 'secondary'" size="sm" @click="setLocale('fr')">Français</UButton>
      </div>
    </section>

    <!-- Theme -->
    <section class="card mb-6">
      <h2 class="text-sm font-medium text-surface-300 mb-3">{{ t('settings.theme') }}</h2>
      <div class="flex gap-2">
        <UButton :variant="theme === 'light' ? 'primary' : 'secondary'" size="sm" @click="setTheme('light')">
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
          {{ t('settings.light') }}
        </UButton>
        <UButton :variant="theme === 'dark' ? 'primary' : 'secondary'" size="sm" @click="setTheme('dark')">
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
          {{ t('settings.dark') }}
        </UButton>
        <UButton :variant="theme === 'system' ? 'primary' : 'secondary'" size="sm" @click="setTheme('system')">
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
          {{ t('settings.system') }}
        </UButton>
      </div>
    </section>

    <!-- AI Providers -->
    <section class="space-y-4">
      <h2 class="text-sm font-medium text-surface-300">{{ t('settings.providers') }}</h2>

      <div v-for="p in providers" :key="p.provider" class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium" :class="p.color">{{ p.name }}</h3>
          <div class="flex items-center gap-2">
            <UBadge v-if="p.isActive && p.hasApiKey" variant="active">
              {{ t('settings.active') }}
            </UBadge>
            <UBadge v-else variant="archived">
              {{ t('settings.inactive') }}
            </UBadge>
            <button
              v-if="p.isActive && p.hasApiKey"
              class="rounded p-1 text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              :title="t('settings.disable')"
              @click="disableProvider(p.provider)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <UInput
            v-model="apiKeys[p.provider]"
            :label="t('settings.apiKey')"
            :placeholder="p.hasApiKey ? '••••••••' : t('settings.apiKeyPlaceholder')"
            type="password"
          />

          <!-- Model selection -->
          <div>
            <label class="block text-xs font-medium text-surface-400 mb-2">{{ t('settings.models') }}</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="model in p.availableModels"
                :key="model.id"
                class="rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer"
                :class="selectedModels[p.provider]?.includes(model.id) ? 'border-accent bg-accent/10 text-accent-300' : 'border-surface-700 text-surface-400 hover:border-surface-600'"
                @click="toggleModel(p.provider, model.id)"
              >
                {{ model.name }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <UButton
              variant="ghost"
              size="sm"
              :disabled="!apiKeys[p.provider]"
              @click="testConnection(p.provider)"
            >
              {{ t('settings.testConnection') }}
            </UButton>
            <span v-if="testResults[p.provider] === true" class="text-xs text-green-400">{{ t('settings.connectionSuccess') }}</span>
            <span v-if="testResults[p.provider] === false" class="text-xs text-red-400">{{ t('settings.connectionFailed') }}</span>

            <div class="flex-1" />

            <UButton
              variant="primary"
              size="sm"
              :disabled="!apiKeys[p.provider]"
              :loading="saving[p.provider]"
              @click="saveProvider(p.provider)"
            >
              {{ t('settings.save') }}
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <UToast
      :message="toast.message"
      :type="toast.type"
      :visible="toast.visible"
      @close="toast.visible = false"
    />
  </div>
</template>
