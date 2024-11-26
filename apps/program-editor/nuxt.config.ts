import Nearley from './vite/nearley'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  extends: ['@teleskop/nuxt-base'],
  css: ['./assets/stylesheets/global.css'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',

    dmexchangeEnabled: false,
    dmexchangeHost: 'localhost',
    dmexchangeUser: '',
    dmexchangePort: '1433',
    dmexchangePassword: '',
    dmexchangeDatabase: 'DmExchange',
    dmexchangeInstanceName: '',

    teleskopTimezoneOffset: -180,

    twName: 'program-editor',
    public: {
      kcClientId: 'program-editor',
      kcEnabled: true,
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
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite type inference
      plugins: [Nearley()],
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          allowJs: true,
          experimentalDecorators: true,
        },
      },
    },
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
  },
  vite: {
    plugins: [
      Nearley(),
    ],
  },
})
