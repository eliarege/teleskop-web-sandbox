export default defineNuxtConfig({
  devtools: {
    enabled: true,
    componentInspector: false,
  },
  extends: ['@teleskop/nuxt-base'],
  ssr: false,
  i18n: {
    langDir: './locales',
    locales: [
      { code: 'en', file: './en.json' },
      { code: 'tr', file: './tr.json' },
    ],
  },
  runtimeConfig: {
    public: {
      kcEnabled: false,
      kcClientId: 'machines',
    },
  },
  vite: {
    build: {
      minify: false,
    },
  },
})
