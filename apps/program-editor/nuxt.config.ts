// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['nuxt-base', 'nuxt-ui'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: '',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    teleskopInstanceName: '',
    public: {
      kcClientId: 'program-editor',
    },
  },
  i18n: {
    lazy: true,
    langDir: './locales',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'tr', name: 'Türkçe', file: 'tr.json' },
    ],
  },
  nitro: {
    typescript: {
      tsConfig: {
        compilerOptions: {
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
})
