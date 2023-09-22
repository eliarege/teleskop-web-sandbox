// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  i18n: {
    langDir: 'locales',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'tr', file: 'tr.json' },
    ],
  },
})
