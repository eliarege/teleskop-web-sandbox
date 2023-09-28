// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['@unocss/reset/tailwind.css', 'element-plus/dist/index.css'],
  modules: [
    '@element-plus/nuxt',
    'nuxt-quasar-ui',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
  ],
})
