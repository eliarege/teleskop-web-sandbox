// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['@unocss/reset/tailwind.css'],
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@element-plus/nuxt',
    'nuxt-quasar-ui',
  ],
  quasar: {
    plugins: [
      'Dialog',
      'Notify',
    ],
  },
})
