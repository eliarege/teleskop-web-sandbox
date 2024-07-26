import Nearley from './vite/nearley'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  extends: ['nuxt-base'],
  css: ['./assets/stylesheets/global.css'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    teleskopTimezoneOffset: -180,
    public: {
      kcClientId: 'program-editor',
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
