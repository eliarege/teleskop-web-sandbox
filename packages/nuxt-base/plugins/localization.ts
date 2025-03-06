import tr from 'quasar/lang/tr'
import en from 'quasar/lang/en-GB.js'
import pt from 'quasar/lang/pt.js'

export default defineNuxtPlugin(() => {
  const { lang } = useQuasar()
  const { $i18n } = useNuxtApp()

  useHead({
    title: () => $i18n.t('app.name', import.meta.dev
      ? 'Set \'app.name\' in application locales'
      : 'Teleskop Web'),
  })

  watch($i18n.locale, (newLocale) => {
    switch (newLocale) {
      case 'tr':
        return lang.set(tr)
      case 'pt':
        return lang.set(pt)
      default:
        return lang.set(en)
    }
  }, { immediate: true })
})
