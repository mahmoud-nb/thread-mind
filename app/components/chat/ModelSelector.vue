<script setup lang="ts">
interface ModelOption {
  id: string
  name: string
}

interface ProviderGroup {
  provider: string
  name: string
  color: string
  models: ModelOption[]
}

const props = defineProps<{
  providers: ProviderGroup[]
  selectedProvider: string
  selectedModel: string
}>()

const emit = defineEmits<{
  'update:selectedProvider': [value: string]
  'update:selectedModel': [value: string]
}>()

const { t } = useI18n()
const isOpen = ref(false)
const selectorRef = ref<HTMLElement>()
const searchQuery = ref('')

// Current selection display
const currentProvider = computed(() =>
  props.providers.find(p => p.provider === props.selectedProvider),
)
const currentModel = computed(() =>
  currentProvider.value?.models.find(m => m.id === props.selectedModel),
)

// Filtered providers/models based on search
const filteredProviders = computed(() => {
  if (!searchQuery.value.trim()) return props.providers
  const q = searchQuery.value.toLowerCase()
  return props.providers
    .map(p => ({
      ...p,
      models: p.models.filter(m =>
        m.name.toLowerCase().includes(q)
        || p.name.toLowerCase().includes(q),
      ),
    }))
    .filter(p => p.models.length > 0)
})

function selectModel(providerKey: string, modelId: string) {
  emit('update:selectedProvider', providerKey)
  emit('update:selectedModel', modelId)
  isOpen.value = false
  searchQuery.value = ''
}

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    nextTick(() => {
      selectorRef.value?.querySelector<HTMLInputElement>('input')?.focus()
    })
  }
}

function onClickOutside(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// Color mapping from Tailwind class to CSS-friendly values
const colorMap: Record<string, string> = {
  'text-orange-400': '#fb923c',
  'text-green-400': '#4ade80',
  'text-blue-400': '#60a5fa',
  'text-cyan-400': '#22d3ee',
  'text-amber-400': '#fbbf24',
  'text-indigo-400': '#818cf8',
}

function getDotColor(color: string): string {
  return colorMap[color] || '#a78bfa'
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="selectorRef" class="relative">
    <!-- Trigger button -->
    <button
      class="model-selector-trigger"
      :class="{ 'model-selector-trigger--open': isOpen }"
      @click="toggle"
    >
      <template v-if="currentProvider && currentModel">
        <span
          class="model-selector-dot"
          :style="{ backgroundColor: getDotColor(currentProvider.color) }"
        />
        <span class="model-selector-provider">{{ currentProvider.name }}</span>
        <span class="model-selector-sep">/</span>
        <span class="model-selector-model">{{ currentModel.name }}</span>
      </template>
      <template v-else>
        <span class="text-surface-500 text-xs">{{ t('chat.model') }}</span>
      </template>
      <svg
        class="model-selector-chevron"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Dropdown popover -->
    <Transition
      enter-active-class="duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div v-if="isOpen" class="model-selector-popover">
        <!-- Search input -->
        <div v-if="providers.length > 2 || providers.reduce((n, p) => n + p.models.length, 0) > 4" class="model-selector-search-wrap">
          <svg class="model-selector-search-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            v-model="searchQuery"
            class="model-selector-search"
            :placeholder="t('common.search')"
            @keydown.esc="isOpen = false"
          />
        </div>

        <!-- Provider groups -->
        <div class="model-selector-list">
          <div v-if="filteredProviders.length === 0" class="px-3 py-4 text-center text-xs text-surface-500">
            {{ t('common.noResults') }}
          </div>

          <div
            v-for="(group, gi) in filteredProviders"
            :key="group.provider"
          >
            <div v-if="gi > 0" class="model-selector-divider" />
            <!-- Provider header -->
            <div class="model-selector-group-header">
              <span
                class="model-selector-dot"
                :style="{ backgroundColor: getDotColor(group.color) }"
              />
              <span>{{ group.name }}</span>
            </div>
            <!-- Models -->
            <button
              v-for="model in group.models"
              :key="model.id"
              class="model-selector-item"
              :class="{
                'model-selector-item--active': selectedProvider === group.provider && selectedModel === model.id
              }"
              @click="selectModel(group.provider, model.id)"
            >
              <span class="model-selector-item-name">{{ model.name }}</span>
              <svg
                v-if="selectedProvider === group.provider && selectedModel === model.id"
                class="model-selector-check"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Trigger ─────────────────────────────── */
.model-selector-trigger {
  @apply flex items-center gap-1.5 rounded-lg border border-surface-700 bg-surface-900 px-2.5 py-1.5 text-xs transition-all cursor-pointer;
  @apply hover:border-surface-600 hover:bg-surface-800;
}
.model-selector-trigger--open {
  @apply border-accent/50 ring-1 ring-accent/20;
}
.model-selector-dot {
  @apply inline-block h-2 w-2 rounded-full flex-shrink-0;
}
.model-selector-provider {
  @apply text-surface-400 font-medium;
}
.model-selector-sep {
  @apply text-surface-600;
}
.model-selector-model {
  @apply text-surface-200 font-medium;
}
.model-selector-chevron {
  @apply h-3.5 w-3.5 text-surface-500 transition-transform duration-150 ml-0.5;
}

/* ── Popover ─────────────────────────────── */
.model-selector-popover {
  @apply absolute bottom-full left-0 z-50 mb-2 w-64 origin-bottom-left;
  @apply rounded-xl border border-surface-700 bg-surface-900 shadow-2xl;
  @apply overflow-hidden;
}

/* ── Search ──────────────────────────────── */
.model-selector-search-wrap {
  @apply relative border-b border-surface-800 px-3 py-2;
}
.model-selector-search-icon {
  @apply absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500;
}
.model-selector-search {
  @apply w-full bg-transparent pl-6 text-xs text-surface-200 placeholder-surface-500 outline-none;
}

/* ── List ────────────────────────────────── */
.model-selector-list {
  @apply max-h-64 overflow-y-auto py-1;
}
.model-selector-divider {
  @apply mx-3 my-1 border-t border-surface-800;
}

/* ── Group header ────────────────────────── */
.model-selector-group-header {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500;
}

/* ── Item ────────────────────────────────── */
.model-selector-item {
  @apply flex w-full items-center justify-between px-3 py-1.5 text-xs text-surface-300 transition-colors cursor-pointer;
  @apply hover:bg-surface-800 hover:text-surface-100;
  padding-left: 1.75rem;
}
.model-selector-item--active {
  @apply text-accent-300;
  background-color: rgba(99, 102, 241, 0.08);
}
.model-selector-item--active:hover {
  background-color: rgba(99, 102, 241, 0.12);
}
.model-selector-item-name {
  @apply truncate;
}
.model-selector-check {
  @apply h-3.5 w-3.5 flex-shrink-0 text-accent;
}
</style>
