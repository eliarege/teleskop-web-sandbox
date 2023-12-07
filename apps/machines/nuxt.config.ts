import process from 'node:process'
import string from 'rollup-plugin-string'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: 'EliarClient',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
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
