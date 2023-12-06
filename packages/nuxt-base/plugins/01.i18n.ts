import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

export default defineNuxtPlugin(({ vueApp }) => {
  const locale = useCookie('locale')
  const i18n = createI18n({
    legacy: false,
    locale: locale.value || 'en',
    messages,
    fallbackLocale: 'en-US',
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
  })

  vueApp.use(i18n)
})
