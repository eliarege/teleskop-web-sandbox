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
    teleskopHost: process.env.TELESKOP_HOST,
    teleskopUser: process.env.TELESKOP_USER,
    teleskopPort: process.env.TELESKOP_PORT,
    teleskopPassword: process.env.TELESKOP_PASSWORD,
    teleskopDatabase: process.env.TELESKOP_DATABASE,
    machineStatusUrl: process.env.MACHINE_STATUS_URL,
    isStaging: process.env.IS_STAGING,
    public: {
      teleskopHasLogs: process.env.TELESKOP_HAS_DY_LOGS,
      websockifyPort: process.env.WEBSOCKIFY_PORT,
      appList: process.env.APP_LIST,
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
