import string from '@teleskop/rollup-plugin-string'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: {
    enabled: false,
  },
  extends: ['@teleskop/nuxt-base'],
  spaLoadingTemplate: false,
  ssr: false,
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    machineStatusUrl: 'http://localhost:3050',
    isStaging: 'no',
    twName: 'multi-monitor',
    public: {
      kcClientId: 'multi-monitor',
      isDigitalFactory: 'false',
      teleskopHasLogs: 'true',
      websockifyUrl: 'http://localhost:6800',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en-GB', files: ['en.json', 'projectTranslations.ts'] },
      { code: 'tr', files: ['tr.json', 'projectTranslations.ts'] },
      { code: 'pt', files: ['pt.json', 'projectTranslations.ts'] },
    ],
  },
  keycloak: {
    globalMiddleware: false,
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.sql'] }),
      ],
    },
  },
})
