// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    public: {
      kcClientId: 'program-editor',
    },
  },
})
