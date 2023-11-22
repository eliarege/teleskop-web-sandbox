import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  ssr: false,
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
    ],
  },
})
