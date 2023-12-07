import process from 'node:process'
import type { Plugin as RollupPlugin } from 'rollup'
import string from 'rollup-plugin-string'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST || 'localhost',
    teleskopUser: process.env.TELESKOP_USER || 'sa',
    teleskopPort: process.env.TELESKOP_PORT || '1433',
    teleskopPassword: process.env.TELESKOP_PASSWORD || '145236987Alp',
    teleskopDatabase: process.env.TELESKOP_DATABASE || 'Teleskop',
    planningEngineUrl: process.env.PLANNING_ENGINE_URL || 'http://localhost:3500',
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.sql'] }),
      ],
    },
  },
  css: ['@bryntum/schedulerpro-trial/schedulerpro.classic.css'],
})
