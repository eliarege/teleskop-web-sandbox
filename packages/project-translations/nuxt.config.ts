export default defineNuxtConfig({
  extends: ['@teleskop/nuxt-base'],
  runtimeConfig: {
    teleskopHost: '',
    teleskopUser: '',
    teleskopPort: '',
    teleskopPassword: '',
    teleskopDatabase: '',
    teleskopInstanceName: '',
  },
})
