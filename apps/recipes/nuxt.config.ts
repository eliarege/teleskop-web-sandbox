// https://v3.nuxtjs.org/api/configuration/nuxt.config
import { basename, extname, resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import virtual from '@rollup/plugin-virtual'

const migrations = readdirSync('./server/migrations').sort()
const getMigrationName = (name: string) => `_${basename(name, extname(name))}`

export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['@teleskop/nuxt-base'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  runtimeConfig: {
    dmsHost: 'localhost',
    dmsUser: 'username',
    dmsPort: '5433',
    dmsPassword: '123456',
    dmsDatabase: 'testo',
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
      kcEnabled: false,
      websockifyUrl: 'ws://localhost:6800',
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
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        virtual({
          '#migration-source': `\
${migrations.map((mig) => {
  return `import * as ${getMigrationName(mig)} from '~/server/migrations/${mig}'`
}).join('\n')}
const migrations = { ${migrations.map(getMigrationName)} }

export const MigrationSource = {
  getMigrations() {
    // Return a list of migration file names
    return Promise.resolve(Object.keys(migrations));
  },

  getMigrationName(migration) {
    return migration;
  },

  getMigration(migration) {
    return migrations[migration];
  }
}
`,
        }),
      ],
    },
  },
})
