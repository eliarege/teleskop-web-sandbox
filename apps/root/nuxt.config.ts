// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: false,
  },
  extends: ['@teleskop/nuxt-base'],
  spaLoadingTemplate: false,
  ssr: false,
  typescript: {
    strict: true,
  },
  keycloak: {
    globalMiddleware: false,
  },
  runtimeConfig: {
    public: {
      appList: [
        {
          name: 'machines',
          url: '/machines',
          img: '/machines.png',
        },
        {
          name: 'dispensing-manager-ui',
          url: '/dispensing-manager',
          img: '/dispensing-manager-ui.png',
        },
        {
          name: 'program-editor',
          url: '/program-editor',
          img: '//program-editor.png',
        },
        {
          name: 'planning-board',
          url: '/planning-board',
          img: '/planning-board.png',
        },
        {
          name: 'multi-monitor',
          url: '/multi-monitor',
          img: '/multi-monitor.png',
        },
        {
          name: 'report',
          url: '/report',
          img: '/report.png',
        },
        {
          name: 'archive',
          url: '/archive',
          img: '/archive.png',
        },
      ],
      kcEnabled: true,
      kcClientId: 'root',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en-GB', files: ['en.json'] },
      { code: 'tr', files: ['tr.json'] },
      { code: 'pt', files: ['pt.json'] },
    ],
  },
})
