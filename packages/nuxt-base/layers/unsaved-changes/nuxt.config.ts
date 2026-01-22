export default defineNuxtConfig({
  i18n: {
    langDir: './locales',
    locales: [
      { code: 'en-GB', file: 'en.json' },
      { code: 'tr', file: 'tr.json' },
      { code: 'pt', file: 'pt.json' },
    ],
  },
})
