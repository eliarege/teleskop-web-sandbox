// https://nuxt.com/docs/api/configuration/nuxt-config
import i18n from '@intlify/unplugin-vue-i18n/vite'

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },
  vite: {
    plugins: [
      i18n({ include: ['locales/*'] }),
    ],
  },
  css: ['element-plus/dist/index.css'],
  modules: [
    // https://github.com/Maiquu/nuxt-quasar
    'nuxt-quasar-ui',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/devtools',
    '@element-plus/nuxt',
  ],
  quasar: {
    plugins: [
      'Dialog',
    ],
  },
  nitro: {},
})
