import process from 'node:process'
import type { Plugin as RollupPlugin } from 'rollup'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  extends: ['nuxt-base'],
  runtimeConfig: {
    teleskopHost: process.env.TELESKOP_HOST,
    teleskopUser: process.env.TELESKOP_USER,
    teleskopPort: process.env.TELESKOP_PORT,
    teleskopPassword: process.env.TELESKOP_PASSWORD,
    teleskopDatabase: process.env.TELESKOP_DATABASE,
  },
  nitro: {
    rollupConfig: {
      // @ts-expect-error type check
      plugins: [
        <RollupPlugin>{
          name: 'rollup-plugin-sql',
          transform(code, id) {
            if (id.endsWith('.sql')) {
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
  css: ['@bryntum/schedulerpro-trial/schedulerpro.classic.css'],
})
