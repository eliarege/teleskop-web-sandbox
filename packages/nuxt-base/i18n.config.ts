export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  datetimeFormats: {
    'en-GB': {
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
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },

    },
    'tr': {
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
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },

    },
  },
}))
