<script setup lang="ts">
const { t, locale } = useI18n()

interface DocPage {
  id: string
  icon: string
  titleKey: string
}

const pages: DocPage[] = [
  { id: 'overview', icon: 'home', titleKey: 'docs.overview' },
  { id: 'getting-started', icon: 'rocket', titleKey: 'docs.gettingStarted' },
  { id: 'concepts', icon: 'lightbulb', titleKey: 'docs.concepts' },
  { id: 'providers', icon: 'cpu', titleKey: 'docs.providers' },
  { id: 'modes', icon: 'layers', titleKey: 'docs.modes' },
  { id: 'team', icon: 'users', titleKey: 'docs.teamMode' },
  { id: 'shortcuts', icon: 'keyboard', titleKey: 'docs.shortcuts' },
]

const activePage = ref('overview')

const appStore = useAppStore()
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-800 px-4 py-3">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <span class="text-sm font-semibold text-surface-200">{{ t('docs.title') }}</span>
      </div>
      <button
        class="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
        @click="appStore.toggleDocPanel()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation tabs -->
    <div class="doc-nav border-b border-surface-800">
      <button
        v-for="page in pages"
        :key="page.id"
        class="doc-nav-item"
        :class="{ 'doc-nav-item--active': activePage === page.id }"
        @click="activePage = page.id"
      >
        <DocsDocIcon :name="page.icon" class="h-3.5 w-3.5" />
        <span>{{ t(page.titleKey) }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="doc-content">
        <!-- Overview -->
        <template v-if="activePage === 'overview'">
          <div class="doc-hero">
            <div class="doc-hero-icon">
              <svg class="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h1 class="doc-title">ThreadMind</h1>
            <p class="doc-subtitle">{{ t('docs.overviewSubtitle') }}</p>
          </div>

          <div class="doc-section">
            <p class="doc-text">{{ t('docs.overviewIntro') }}</p>
          </div>

          <div class="doc-features">
            <div class="doc-feature-card">
              <div class="doc-feature-icon bg-blue-500/10 text-blue-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3>{{ t('docs.featureThreads') }}</h3>
              <p>{{ t('docs.featureThreadsDesc') }}</p>
            </div>
            <div class="doc-feature-card">
              <div class="doc-feature-icon bg-green-500/10 text-green-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3>{{ t('docs.featureContext') }}</h3>
              <p>{{ t('docs.featureContextDesc') }}</p>
            </div>
            <div class="doc-feature-card">
              <div class="doc-feature-icon bg-orange-500/10 text-orange-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1 3.36.97-5.65L3.2 8.97l5.67-.82L11.42 3l2.53 5.15 5.67.82-4.1 3.91.97 5.65-5.1-3.36z" />
                </svg>
              </div>
              <h3>{{ t('docs.featureMultiProvider') }}</h3>
              <p>{{ t('docs.featureMultiProviderDesc') }}</p>
            </div>
            <div class="doc-feature-card">
              <div class="doc-feature-icon bg-purple-500/10 text-purple-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3>{{ t('docs.featureTeam') }}</h3>
              <p>{{ t('docs.featureTeamDesc') }}</p>
            </div>
          </div>
        </template>

        <!-- Getting Started -->
        <template v-if="activePage === 'getting-started'">
          <h2 class="doc-page-title">{{ t('docs.gettingStarted') }}</h2>

          <div class="doc-section">
            <h3 class="doc-heading">1. {{ t('docs.gsInstall') }}</h3>
            <div class="doc-code">
              <code>npx thread-mind</code>
            </div>
            <p class="doc-text doc-text--muted">{{ t('docs.gsInstallDesc') }}</p>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">2. {{ t('docs.gsApiKey') }}</h3>
            <p class="doc-text">{{ t('docs.gsApiKeyDesc') }}</p>
            <div class="doc-steps">
              <div class="doc-step">
                <span class="doc-step-number">1</span>
                <span>{{ t('docs.gsApiKeyStep1') }}</span>
              </div>
              <div class="doc-step">
                <span class="doc-step-number">2</span>
                <span>{{ t('docs.gsApiKeyStep2') }}</span>
              </div>
              <div class="doc-step">
                <span class="doc-step-number">3</span>
                <span>{{ t('docs.gsApiKeyStep3') }}</span>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">3. {{ t('docs.gsProject') }}</h3>
            <p class="doc-text">{{ t('docs.gsProjectDesc') }}</p>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">4. {{ t('docs.gsFirstThread') }}</h3>
            <p class="doc-text">{{ t('docs.gsFirstThreadDesc') }}</p>
          </div>
        </template>

        <!-- Concepts -->
        <template v-if="activePage === 'concepts'">
          <h2 class="doc-page-title">{{ t('docs.concepts') }}</h2>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.conceptThreads') }}</h3>
            <p class="doc-text">{{ t('docs.conceptThreadsDesc') }}</p>
            <div class="doc-callout doc-callout--info">
              <p>{{ t('docs.conceptThreadsTip') }}</p>
            </div>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.conceptContext') }}</h3>
            <p class="doc-text">{{ t('docs.conceptContextDesc') }}</p>
            <div class="doc-diagram">
              <div class="doc-diagram-item">
                <span class="doc-diagram-label">{{ t('docs.conceptContextPinned') }}</span>
                <div class="doc-diagram-bar bg-accent/30" style="width: 100%"></div>
              </div>
              <div class="doc-diagram-item">
                <span class="doc-diagram-label">{{ t('docs.conceptContextSummary') }}</span>
                <div class="doc-diagram-bar bg-blue-500/30" style="width: 70%"></div>
              </div>
              <div class="doc-diagram-item">
                <span class="doc-diagram-label">{{ t('docs.conceptContextRecent') }}</span>
                <div class="doc-diagram-bar bg-green-500/30" style="width: 50%"></div>
              </div>
              <div class="doc-diagram-item">
                <span class="doc-diagram-label">{{ t('docs.conceptContextRefs') }}</span>
                <div class="doc-diagram-bar bg-orange-500/30" style="width: 40%"></div>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.conceptReferences') }}</h3>
            <p class="doc-text">{{ t('docs.conceptReferencesDesc') }}</p>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.conceptPinning') }}</h3>
            <p class="doc-text">{{ t('docs.conceptPinningDesc') }}</p>
          </div>
        </template>

        <!-- Providers -->
        <template v-if="activePage === 'providers'">
          <h2 class="doc-page-title">{{ t('docs.providers') }}</h2>

          <div class="doc-section">
            <p class="doc-text">{{ t('docs.providersIntro') }}</p>
          </div>

          <div class="doc-provider-grid">
            <div class="doc-provider-card">
              <span class="text-orange-400 font-semibold">Anthropic</span>
              <span class="text-xs text-surface-500">Claude Sonnet, Haiku, Opus</span>
            </div>
            <div class="doc-provider-card">
              <span class="text-green-400 font-semibold">OpenAI</span>
              <span class="text-xs text-surface-500">GPT-4o, GPT-4o Mini</span>
            </div>
            <div class="doc-provider-card">
              <span class="text-blue-400 font-semibold">Google</span>
              <span class="text-xs text-surface-500">Gemini 2.5 Flash / Pro</span>
            </div>
            <div class="doc-provider-card">
              <span class="text-cyan-400 font-semibold">DeepSeek</span>
              <span class="text-xs text-surface-500">DeepSeek Chat / Reasoner</span>
            </div>
            <div class="doc-provider-card">
              <span class="text-amber-400 font-semibold">Mistral</span>
              <span class="text-xs text-surface-500">Large, Small, Codestral</span>
            </div>
            <div class="doc-provider-card">
              <span class="text-indigo-400 font-semibold">Meta</span>
              <span class="text-xs text-surface-500">Llama 3.3, 4 (via Together AI)</span>
            </div>
          </div>

          <div class="doc-section">
            <div class="doc-callout doc-callout--tip">
              <p>{{ t('docs.providersTip') }}</p>
            </div>
          </div>
        </template>

        <!-- Modes -->
        <template v-if="activePage === 'modes'">
          <h2 class="doc-page-title">{{ t('docs.modes') }}</h2>

          <div class="doc-section">
            <p class="doc-text">{{ t('docs.modesIntro') }}</p>
          </div>

          <div class="doc-modes-comparison">
            <div class="doc-mode-card doc-mode-card--plan">
              <div class="doc-mode-header">
                <span class="doc-mode-badge bg-blue-500/20 text-blue-400">{{ t('chat.planMode') }}</span>
              </div>
              <ul class="doc-mode-list">
                <li>{{ t('docs.planFeature1') }}</li>
                <li>{{ t('docs.planFeature2') }}</li>
                <li>{{ t('docs.planFeature3') }}</li>
              </ul>
            </div>
            <div class="doc-mode-card doc-mode-card--agent">
              <div class="doc-mode-header">
                <span class="doc-mode-badge bg-orange-500/20 text-orange-400">{{ t('chat.agentMode') }}</span>
              </div>
              <ul class="doc-mode-list">
                <li>{{ t('docs.agentFeature1') }}</li>
                <li>{{ t('docs.agentFeature2') }}</li>
                <li>{{ t('docs.agentFeature3') }}</li>
                <li>{{ t('docs.agentFeature4') }}</li>
              </ul>
            </div>
          </div>

          <div class="doc-section">
            <div class="doc-callout doc-callout--warning">
              <p>{{ t('docs.modesWarning') }}</p>
            </div>
          </div>
        </template>

        <!-- Team Mode -->
        <template v-if="activePage === 'team'">
          <h2 class="doc-page-title">{{ t('docs.teamMode') }}</h2>

          <div class="doc-section">
            <p class="doc-text">{{ t('docs.teamIntro') }}</p>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.teamHowItWorks') }}</h3>
            <div class="doc-steps">
              <div class="doc-step">
                <span class="doc-step-number">1</span>
                <span>{{ t('docs.teamStep1') }}</span>
              </div>
              <div class="doc-step">
                <span class="doc-step-number">2</span>
                <span>{{ t('docs.teamStep2') }}</span>
              </div>
              <div class="doc-step">
                <span class="doc-step-number">3</span>
                <span>{{ t('docs.teamStep3') }}</span>
              </div>
              <div class="doc-step">
                <span class="doc-step-number">4</span>
                <span>{{ t('docs.teamStep4') }}</span>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.teamRules') }}</h3>
            <div class="doc-callout doc-callout--info">
              <ul class="space-y-1.5">
                <li>{{ t('docs.teamRule1') }}</li>
                <li>{{ t('docs.teamRule2') }}</li>
                <li>{{ t('docs.teamRule3') }}</li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Shortcuts -->
        <template v-if="activePage === 'shortcuts'">
          <h2 class="doc-page-title">{{ t('docs.shortcuts') }}</h2>

          <div class="doc-section">
            <div class="doc-shortcut-table">
              <div class="doc-shortcut-row">
                <kbd>Enter</kbd>
                <span>{{ t('docs.shortcutSend') }}</span>
              </div>
              <div class="doc-shortcut-row">
                <kbd>Shift + Enter</kbd>
                <span>{{ t('docs.shortcutNewline') }}</span>
              </div>
            </div>
          </div>

          <div class="doc-section">
            <h3 class="doc-heading">{{ t('docs.shortcutPanels') }}</h3>
            <p class="doc-text">{{ t('docs.shortcutPanelsDesc') }}</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-nav {
  @apply flex flex-wrap gap-0.5 px-2 py-2;
}
.doc-nav-item {
  @apply flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200;
}
.doc-nav-item--active {
  @apply bg-surface-800 text-accent font-medium;
}

.doc-content {
  @apply px-5 py-4;
}

.doc-hero {
  @apply mb-6 text-center;
}
.doc-hero-icon {
  @apply mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10;
}
.doc-title {
  @apply text-2xl font-bold text-surface-100;
}
.doc-subtitle {
  @apply mt-1 text-sm text-surface-400;
}

.doc-page-title {
  @apply mb-4 text-lg font-bold text-surface-100;
}

.doc-section {
  @apply mb-5;
}
.doc-heading {
  @apply mb-2 text-sm font-semibold text-surface-200;
}
.doc-text {
  @apply text-xs leading-relaxed text-surface-400;
}
.doc-text--muted {
  @apply mt-1.5 text-surface-500;
}

.doc-code {
  @apply my-2 rounded-lg bg-surface-950 px-4 py-3 font-mono text-xs text-accent;
}

.doc-callout {
  @apply mt-3 rounded-lg border px-4 py-3 text-xs leading-relaxed;
}
.doc-callout--info {
  @apply border-blue-500/20 bg-blue-500/5 text-blue-300;
}
.doc-callout--tip {
  @apply border-green-500/20 bg-green-500/5 text-green-300;
}
.doc-callout--warning {
  @apply border-orange-500/20 bg-orange-500/5 text-orange-300;
}

.doc-steps {
  @apply mt-3 space-y-2;
}
.doc-step {
  @apply flex items-start gap-3 text-xs text-surface-300;
}
.doc-step-number {
  @apply flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent;
}

.doc-features {
  @apply grid grid-cols-2 gap-3 mb-4;
}
.doc-feature-card {
  @apply rounded-lg border border-surface-800 bg-surface-900/50 p-3;
}
.doc-feature-card h3 {
  @apply mt-2 text-xs font-semibold text-surface-200;
}
.doc-feature-card p {
  @apply mt-1 text-[11px] leading-relaxed text-surface-500;
}
.doc-feature-icon {
  @apply flex h-8 w-8 items-center justify-center rounded-lg;
}

.doc-diagram {
  @apply mt-3 space-y-2.5;
}
.doc-diagram-item {
  @apply flex items-center gap-3;
}
.doc-diagram-label {
  @apply w-24 flex-shrink-0 text-[11px] text-surface-400;
}
.doc-diagram-bar {
  @apply h-3 rounded-full;
}

.doc-provider-grid {
  @apply grid grid-cols-2 gap-2 mb-4;
}
.doc-provider-card {
  @apply flex flex-col gap-0.5 rounded-lg border border-surface-800 bg-surface-900/50 px-3 py-2.5;
}

.doc-modes-comparison {
  @apply grid grid-cols-1 gap-3 mb-4;
}
.doc-mode-card {
  @apply rounded-lg border border-surface-800 bg-surface-900/50 p-3;
}
.doc-mode-header {
  @apply mb-2;
}
.doc-mode-badge {
  @apply rounded-md px-2.5 py-1 text-xs font-semibold;
}
.doc-mode-list {
  @apply space-y-1.5 text-xs text-surface-400;
}
.doc-mode-list li {
  @apply flex items-start gap-2;
}
.doc-mode-list li::before {
  content: '•';
  @apply text-surface-600 flex-shrink-0;
}

.doc-shortcut-table {
  @apply space-y-2;
}
.doc-shortcut-row {
  @apply flex items-center justify-between text-xs;
}
.doc-shortcut-row kbd {
  @apply rounded border border-surface-700 bg-surface-800 px-2 py-0.5 font-mono text-[11px] text-surface-300;
}
.doc-shortcut-row span {
  @apply text-surface-400;
}
</style>
