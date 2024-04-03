import string from 'rollup-plugin-string'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@formkit/nuxt'],
  formkit: {
    autoImport: true,
  },
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base', 'nuxt-ui'],
  runtimeConfig: {
    teleskopHost: 'localhost',
    teleskopUser: 'EliarClient',
    teleskopPort: '1433',
    teleskopPassword: '',
    teleskopDatabase: 'Teleskop',
    nodeEnv: 'test',
    public: {
      kcClientId: 'machines',
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
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.wsdl'] }),
      ],
    },
  },
})
