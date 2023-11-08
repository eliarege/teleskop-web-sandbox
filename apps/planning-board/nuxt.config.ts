import process from 'node:process'
import type { Plugin as RollupPlugin } from 'rollup'
import string from 'rollup-plugin-string'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST,
    teleskopUser: process.env.TELESKOP_USER,
    teleskopPort: process.env.TELESKOP_PORT,
    teleskopPassword: process.env.TELESKOP_PASSWORD,
    teleskopDatabase: process.env.TELESKOP_DATABASE,
    public: {
      appList: process.env.APP_LIST,
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
  css: ['@bryntum/schedulerpro-trial/schedulerpro.classic.css'],
})
