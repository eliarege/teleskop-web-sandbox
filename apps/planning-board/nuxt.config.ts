import string from 'rollup-plugin-string'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    planningEngineUrl: 'http://localhost:3500',
    public: {
      kcClientId: 'planning-board',
      websockifyUrl: 'ws://localhost:6800',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'tr', file: 'tr.json' },
    ],
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.sql'] }),
      ],
    },
  },
  css: ['@bryntum/schedulerpro-trial/schedulerpro.classic.css'],
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    vue: {
      template: {
        transformAssetUrls: {
          LoadingScreen: ['image'],
        },
      },
    },
  },
})
