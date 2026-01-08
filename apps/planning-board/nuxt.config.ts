import string from '@teleskop/rollup-plugin-string'
import Base64Loader from './vite/base64'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: false },
  extends: ['@teleskop/nuxt-base', '@teleskop/project-translations'],
  runtimeConfig: {
    planningEngineUrl: 'http://localhost:3500',
    public: {
      kcClientId: 'planning-board',
      websockifyUrl: 'ws://localhost:6800',
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
        string({ ext: ['.sql'] }),
      ],
    },
  },
  css: ['@bryntum/schedulerpro/assets/schedulerpro.classic.css'],
  vite: {
    optimizeDeps: {
      include: ['@bryntum/schedulerpro'],
    },
    plugins: [
      Base64Loader(),
    ],
  },
})
