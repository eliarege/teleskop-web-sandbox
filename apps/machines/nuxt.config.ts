import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  quasar: {
    plugins: [
    ],
  },
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST,
    teleskopUser: process.env.TELESKOP_USER,
    teleskopPort: process.env.TELESKOP_PORT,
    teleskopPassword: process.env.TELESKOP_PASSWORD,
    teleskopDatabase: process.env.TELESKOP_DATABASE,
  },
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
    ],
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error Infinite
      plugins: [
        {
          name: 'machine:wsdl',
          transform(code, id) {
            if (id.endsWith('.wsdl')) {
              return {
                code: `export default ${JSON.stringify(code)}`,
                map: { mappings: '' },
              }
            }
          },

        },
      ],
    },
  },
})
