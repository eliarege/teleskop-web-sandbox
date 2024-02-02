// https://v3.nuxtjs.org/api/configuration/nuxt.config

import { resolve } from 'node:path'

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  ssr: false,
  runtimeConfig: {
    dmsHost: 'localhost',
    dmsUser: 'postgres',
    dmsPort: '5432',
    dmsPassword: '123456',
    dmsDatabase: 'test',
    teleskopHost: '192.168.16.87',
    teleskopUser: 'sa',
    teleskopPort: '7654',
    teleskopPassword: '12345678tT',
    teleskopDatabase: 'Teleskop',
    public: {
      kcUrl: 'http://localhost:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'dispensing-management-systems',
      kcEnabled: true,
      websockifyPort: '6800',
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
  vite: {
    build: {
      rollupOptions: {
        external: [
          resolve(__dirname, '../../packages/ui/components/MachineCard.vue'),
        ],
      },
    },
  },
})
