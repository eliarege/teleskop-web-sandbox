import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

export default defineNuxtPlugin(({ vueApp }) => {
  const route = useRoute()
  const i18n = createI18n({
    legacy: false,
    locale: typeof route.query.lang === 'string' ? route.query.lang : 'en',
    messages,
    fallbackLocale: 'en-US',
    datetimeFormats: {
      'en-US': {
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
      'tr-TR': {
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
  })

  vueApp.use(i18n)
})
