import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    public: {
      appList: process.env.NUXT_PUBLIC_APP_LIST,
      kcUrl: process.env.NUXT_PUBLIC_KC_URL || 'http://localhost:8080',
      kcRealm: process.env.NUXT_PUBLIC_KC_REALM || 'teleskop-web',
      kcClientId: process.env.NUXT_PUBLIC_KC_CLIENT_ID || 'nuxt-client',
    },
  },
  css: ['@unocss/reset/tailwind.css'],
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@element-plus/nuxt',
    'nuxt-quasar-ui',
  ],
  imports: {
    presets: [
      {
        from: 'vue-i18n',
        imports: ['useI18n'],
      },
    ],
  },
  quasar: {
    plugins: [
      'BottomSheet',
      'Dialog',
      'Notify',
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
