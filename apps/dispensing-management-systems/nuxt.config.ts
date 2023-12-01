import process from 'node:process'

// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  ssr: false,
})
