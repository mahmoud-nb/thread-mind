<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { theme, setTheme } = useTheme()

interface ProviderDisplay {
  provider: string
  isActive: boolean
  hasApiKey: boolean
  models: string[]
  availableModels: Array<{ id: string; name: string }>
}

const providers = ref<ProviderDisplay[]>([])
const apiKeys = reactive<Record<string, string>>({ anthropic: '', openai: '', gemini: '' })
const selectedModels = reactive<Record<string, string[]>>({ anthropic: [], openai: [], gemini: [] })
const testResults = reactive<Record<string, boolean | null>>({ anthropic: null, openai: null, gemini: null })
const saving = ref<Record<string, boolean>>({})
const toast = ref({ visible: false, message: '', type: 'success' as 'success' | 'error' })

const allProviders = [
  { key: 'anthropic', name: 'Anthropic (Claude)', color: 'text-orange-400' },
  { key: 'openai', name: 'OpenAI (ChatGPT)', color: 'text-green-400' },
  { key: 'gemini', name: 'Google (Gemini)', color: 'text-blue-400' },
]

async function loadProviders() {
  try {
    providers.value = await $fetch('/api/providers')
    for (const p of providers.value) {
      selectedModels[p.provider] = p.models
    }
  } catch {}
}

async function testConnection(provider: string) {
  testResults[provider] = null
  const result = await $fetch('/api/providers/test', {
    method: 'POST',
    body: { provider, apiKey: apiKeys[provider] },
  }) as { success: boolean }
  testResults[provider] = result.success
}

async function saveProvider(provider: string) {
  saving.value[provider] = true
  try {
    await $fetch('/api/providers', {
      method: 'POST',
      body: {
        provider,
        apiKey: apiKeys[provider],
        models: selectedModels[provider],
        isActive: true,
      },
    })
    toast.value = { visible: true, message: t('settings.saved'), type: 'success' }
    await loadProviders()
  } catch {
    toast.value = { visible: true, message: t('common.error'), type: 'error' }
  } finally {
    saving.value[provider] = false
  }
}

const availableModelsForProvider = computed(() => {
  const map: Record<string, Array<{ id: string; name: string }>> = {}
  for (const p of providers.value) {
    map[p.provider] = p.availableModels
  }
  // Fallback for unconfigured providers
  if (!map.anthropic) map.anthropic = [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' }, { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }, { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' }]
  if (!map.openai) map.openai = [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }]
  if (!map.gemini) map.gemini = [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }, { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }]
  return map
})

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
        <UButton
          :variant="locale === 'en' ? 'primary' : 'secondary'"
          size="sm"
          @click="setLocale('en')"
        >
          English
        </UButton>
        <UButton
          :variant="locale === 'fr' ? 'primary' : 'secondary'"
          size="sm"
          @click="setLocale('fr')"
        >
          Français
        </UButton>
      </div>
    </section>

    <!-- Theme -->
    <section class="card mb-6">
      <h2 class="text-sm font-medium text-surface-300 mb-3">{{ t('settings.theme') }}</h2>
      <div class="flex gap-2">
        <UButton
          :variant="theme === 'light' ? 'primary' : 'secondary'"
          size="sm"
          @click="setTheme('light')"
        >
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          {{ t('settings.light') }}
        </UButton>
        <UButton
          :variant="theme === 'dark' ? 'primary' : 'secondary'"
          size="sm"
          @click="setTheme('dark')"
        >
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
          {{ t('settings.dark') }}
        </UButton>
        <UButton
          :variant="theme === 'system' ? 'primary' : 'secondary'"
          size="sm"
          @click="setTheme('system')"
        >
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
          {{ t('settings.system') }}
        </UButton>
      </div>
    </section>

    <!-- AI Providers -->
    <section class="space-y-4">
      <h2 class="text-sm font-medium text-surface-300">{{ t('settings.providers') }}</h2>

      <div v-for="p in allProviders" :key="p.key" class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium" :class="p.color">{{ p.name }}</h3>
          <UBadge
            v-if="providers.find(pr => pr.provider === p.key)"
            variant="active"
          >
            {{ t('settings.connectionSuccess') }}
          </UBadge>
        </div>

        <div class="space-y-3">
          <UInput
            v-model="apiKeys[p.key]"
            :label="t('settings.apiKey')"
            :placeholder="t('settings.apiKeyPlaceholder')"
            type="password"
          />

          <!-- Model selection -->
          <div>
            <label class="block text-xs font-medium text-surface-400 mb-2">{{ t('settings.models') }}</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="model in availableModelsForProvider[p.key] || []"
                :key="model.id"
                class="rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer"
                :class="selectedModels[p.key]?.includes(model.id) ? 'border-accent bg-accent/10 text-accent-300' : 'border-surface-700 text-surface-400 hover:border-surface-600'"
                @click="selectedModels[p.key]?.includes(model.id) ? selectedModels[p.key] = selectedModels[p.key].filter(m => m !== model.id) : (selectedModels[p.key] = [...(selectedModels[p.key] || []), model.id])"
              >
                {{ model.name }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <UButton
              variant="ghost"
              size="sm"
              :disabled="!apiKeys[p.key]"
              @click="testConnection(p.key)"
            >
              {{ t('settings.testConnection') }}
            </UButton>
            <span v-if="testResults[p.key] === true" class="text-xs text-green-400">{{ t('settings.connectionSuccess') }}</span>
            <span v-if="testResults[p.key] === false" class="text-xs text-red-400">{{ t('settings.connectionFailed') }}</span>

            <div class="flex-1" />

            <UButton
              variant="primary"
              size="sm"
              :disabled="!apiKeys[p.key]"
              :loading="saving[p.key]"
              @click="saveProvider(p.key)"
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
