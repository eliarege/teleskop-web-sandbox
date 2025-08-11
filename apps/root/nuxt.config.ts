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
          img: '/app-icons/machines.png',
        },
        {
          name: 'dispensing-manager',
          url: '/dispensing-manager',
          img: '/app-icons/dispensing-manager-ui.png',
        },
        {
          name: 'program-editor',
          url: '/program-editor',
          img: '/app-icons/program-editor.png',
        },
        {
          name: 'planning-board',
          url: '/planning-board',
          img: '/app-icons/planning-board.png',
        },
        {
          name: 'multi-monitor',
          url: '/multi-monitor',
          img: '/app-icons/multi-monitor.png',
        },
        {
          name: 'report',
          url: '/report',
          img: '/app-icons/report.png',
        },
        {
          name: 'archive',
          url: '/archive',
          img: '/app-icons/archive.png',
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
