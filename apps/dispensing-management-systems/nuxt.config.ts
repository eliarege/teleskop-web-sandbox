// https://v3.nuxtjs.org/api/configuration/nuxt.config

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  ssr: false,
  runtimeConfig: {
    dmsHost: process.env.DMS_HOST || 'localhost',
    dmsUser: process.env.DMS_USER || 'postgres',
    dmsPort: process.env.DMS_PORT || '5432',
    dmsPassword: process.env.DMS_PASSWORD || '123456',
    dmsDatabase: process.env.DMS_DATABASE || 'test',
    teleskopHost: process.env.TELESKOP_HOST || '192.168.16.87',
    teleskopUser: process.env.TELESKOP_USER || 'sa',
    teleskopPort: process.env.TELESKOP_PORT || '7654',
    teleskopPassword: process.env.TELESKOP_PASSWORD || '12345678tT',
    teleskopDatabase: process.env.TELESKOP_DATABASE || 'Teleskop',
    public: {
      websockifyPort: process.env.WEBSOCKIFY_PORT || '6800'
    }
  },
})
