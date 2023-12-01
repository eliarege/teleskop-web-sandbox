import process from 'node:process'
import string from 'rollup-plugin-string'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST || 'localhost',
    teleskopUser: process.env.TELESKOP_USER || 'EliarClient',
    teleskopPort: process.env.TELESKOP_PORT || '1433',
    teleskopPassword: process.env.TELESKOP_PASSWORD || '',
    teleskopDatabase: process.env.TELESKOP_DATABASE || 'Teleskop',
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.wsdl'] }),
      ],
    },
  },
})
