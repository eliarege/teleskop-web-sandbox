import string from 'rollup-plugin-string'
import type { Plugin as RollupPlugin } from 'rollup'

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
    machineStatusUrl: 'http://machine-status',
    isStaging: 'false',
    public: {
      kcClientId: 'multi-monitor',
      isDigitalFactory: 'false',
      teleskopHasLogs: 'true',
      websockifyPort: '6800',
    },
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
