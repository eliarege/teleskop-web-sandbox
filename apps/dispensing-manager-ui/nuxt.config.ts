// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    sambaPath: '//192.168.16.88/staging',
    sambaUser: 'eliar',
    sambaPassword: 'eliar',
    reqFilePath: 'manuel.req',
    writeFilePath: 'tmp/index.req',
    public: {
      kcClientId: 'dispensing-manager-ui',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'tr', file: 'tr.json' },
    ],
  },
})
