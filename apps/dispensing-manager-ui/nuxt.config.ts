import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
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
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
    ],
  },
})
