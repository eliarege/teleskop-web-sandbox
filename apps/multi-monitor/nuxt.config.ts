import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'
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
  modules: [],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST || 'localhost',
    teleskopUser: process.env.TELESKOP_USER || '',
    teleskopPort: process.env.TELESKOP_PORT || '1433',
    teleskopPassword: process.env.TELESKOP_PASSWORD || '',
    teleskopDatabase: process.env.TELESKOP_DATABASE || 'Teleskop',
    teleskopInstanceName: process.env.TELESKOP_INSTANCE_NAME || '',
    machineStatusUrl: process.env.MACHINE_STATUS_URL || 'http://machine-status',
    isStaging: process.env.IS_STAGING || 'false',
    public: {
      isDigitalFactory: process.env.IS_DIGITAL_FACTORY || 'false',
      teleskopHasLogs: process.env.TELESKOP_HAS_DY_LOGS || 'true',
      websockifyPort: process.env.WEBSOCKIFY_PORT || '6800',
    },
  },
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
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

})
