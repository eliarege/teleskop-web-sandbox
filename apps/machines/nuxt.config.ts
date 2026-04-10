import string from '@teleskop/rollup-plugin-string'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@formkit/nuxt'],
  formkit: {
    autoImport: true,
  },
  ssr: false,
  devtools: { enabled: true },
  extends: ['@teleskop/nuxt-base'],
  runtimeConfig: {
    teleskopHost: '',
    teleskopUser: '',
    teleskopPort: '',
    teleskopPassword: '',
    teleskopDatabase: '',
    teleskopInstanceName: '',
    dmExchangeEnabled: false,
    dmExchangeHost: '',
    dmExchangePort: '',
    dmExchangeUser: '',
    dmExchangePassword: '',
    dmExchangeDatabase: '',
    dmExchangeInstanceName: '',
    teleskopTimezoneOffset: -180,
    public: {
      kcClientId: 'machines',
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
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        string({ ext: ['.wsdl'] }),
      ],
    },
  },
})
