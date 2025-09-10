import string from '@teleskop/rollup-plugin-string'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: {
    enabled: false,
  },
  extends: ['@teleskop/nuxt-base', '@teleskop/project-translations'],
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
    teleskopTimezoneOffset: -180,
    machineStatusUrl: 'http://localhost:3050',
    isStaging: 'no',
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
      { code: 'en-GB', files: ['en.json'] },
      { code: 'tr', files: ['tr.json'] },
      { code: 'pt', files: ['pt.json'] },
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
