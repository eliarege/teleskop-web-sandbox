import process from 'node:process'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST || 'localhost',
    teleskopUser: process.env.TELESKOP_USER || '',
    teleskopPort: process.env.TELESKOP_PORT || '1433',
    teleskopPassword: process.env.TELESKOP_PASSWORD || '',
    teleskopDatabase: process.env.TELESKOP_DATABASE || 'Teleskop',
  },
})
