export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  datetimeFormats: {
    en: {
      datetime: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
      date: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
    },
    tr: {
      datetime: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
      date: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
    },
  },
}))
