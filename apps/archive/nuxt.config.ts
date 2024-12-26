// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    'golden-layout/dist/css/goldenlayout-base.css',
    './assets/goldenlayout-custom-theme.css',
  ],
  ssr: false,
  devtools: { enabled: false },
  extends: ['@teleskop/nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    teleskopDatabaseUrl: '',
    teleskopArchiveServerUrl: '',
    teleskopTimezoneOffset: -180,
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    defaultLocale: 'en',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'tr', file: 'tr.json' },
    ],
  },
  quasar: {
    plugins: [
      'Loading',
    ],
  },
})
