// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: false },
  extends: ['@teleskop/nuxt-base'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    sambaPath: '//192.168.16.88/staging_dm',
    sambaUser: 'eliar',
    sambaPassword: 'eliar',
    reqFilePath: 'manuel.req',
    writeFilePath: 'index.req',
    addMissingTeleskopColumns: 'false',

    twName: 'dispensing-manager-ui',
    public: {
      kcClientId: 'dispensing-manager-ui',
      websockifyUrl: 'ws://localhost:6800',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en-GB', files: ['en.json'] },
      { code: 'tr', files: ['tr.json'] },
    ],
  },
})
