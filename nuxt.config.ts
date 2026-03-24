export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: '../i18n',
    strategy: 'no_prefix',
  },

  imports: {
    dirs: ['stores'],
  },

  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/thread', pathPrefix: false },
    { path: '~/components/chat', pathPrefix: false },
    { path: '~/components/files', pathPrefix: false },
    { path: '~/components/tokens', pathPrefix: false },
    { path: '~/components/settings', pathPrefix: false },
    '~/components',
  ],

  app: {
    head: {
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('threadmind-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          type: 'text/javascript',
          tagPosition: 'head',
        },
      ],
    },
  },

  devtools: { enabled: true },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
})
