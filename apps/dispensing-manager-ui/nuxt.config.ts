import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  quasar: {
    plugins: [
      'Dialog',
    ],
  },
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
    ],
  },
})
