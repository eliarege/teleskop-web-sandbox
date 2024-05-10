// https://v3.nuxtjs.org/api/configuration/nuxt.config

import { resolve } from 'node:path'
import process from 'node:process'

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base', 'nuxt-ui'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  runtimeConfig: {
    dmsHost: '192.168.18.69',
    dmsUser: 'username',
    dmsPort: '5433',
    dmsPassword: '123456',
    dmsDatabase: 'test',
    teleskopHost: '192.168.16.87',
    teleskopUser: 'sa',
    teleskopPort: '7654',
    teleskopPassword: '12345678tT',
    teleskopDatabase: 'Teleskop',
    sambaPath: '//192.168.19.13/Dms',
    sambaUser: 'root',
    sambaPassword: '1422',
    public: {
      kcUrl: 'http://localhost:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'dispensing-management-systems',
      kcEnabled: true,
      websockifyPort: '6800',
    },
  },
  i18n: {
    lazy: false,
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
