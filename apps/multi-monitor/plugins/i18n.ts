import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

export default defineNuxtPlugin(({ vueApp }) => {
  const url = window.location.search.substring(1)
  const param = url.split('=')
  const i18n = createI18n({
    legacy: false,
    locale: param[1] || 'en',
    messages,
  })

  vueApp.use(i18n)
})
