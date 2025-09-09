export default defineNuxtConfig({
  extends: ['@teleskop/nuxt-base'],
  runtimeConfig: {
    teleskopHost: '',
    teleskopUser: '',
    teleskopPort: '',
    teleskopPassword: '',
    teleskopDatabase: '',
    teleskopInstanceName: '',
  },
  i18n: {
    langDir: './locales',
    locales: [
      { code: 'en-GB', file: './en.json' },
      { code: 'tr', file: './tr.json' },
      { code: 'pt', file: './pt.json' },
    ],
  },
})
