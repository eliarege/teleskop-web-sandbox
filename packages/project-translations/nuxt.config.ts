export default defineNuxtConfig({
  extends: ['@teleskop/nuxt-base'],
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en-GB', files: ['projectTranslations.ts'] },
      { code: 'tr', files: ['projectTranslations.ts'] },
      { code: 'pt', files: ['projectTranslations.ts'] },
    ],
  },
  runtimeConfig: {
    teleskopHost: '',
    teleskopUser: '',
    teleskopPort: '',
    teleskopPassword: '',
    teleskopDatabase: '',
    teleskopInstanceName: '',
  },
})
