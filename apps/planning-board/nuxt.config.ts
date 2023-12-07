import process from 'node:process'
import string from 'rollup-plugin-string'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    planningEngineUrl: 'http://localhost:3500',
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
