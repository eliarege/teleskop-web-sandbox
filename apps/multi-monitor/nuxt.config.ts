import string from 'rollup-plugin-string'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },
  extends: ['nuxt-base'],
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
    machineStatusUrl: 'http://localhost:5000',
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
  vite: {
    vue: {
      template: {
        transformAssetUrls: {
          LoadingScreen: ['image'],
        },
      },
    },
  },
})
