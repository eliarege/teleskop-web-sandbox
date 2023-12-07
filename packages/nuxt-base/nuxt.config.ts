import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    public: {
      appList: '',
      kcUrl: 'http://localhost:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'nuxt-client',
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
