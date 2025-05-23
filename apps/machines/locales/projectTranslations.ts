export default defineI18nLocale(async (locale) => {
  const locales = [
    'tr',
    'en',
    'ru',
    'fa',
    'fa-Latn',
    'pt',
    'es',
    'ar',
    'zh',
    'zh-Hans',
    'el',
    'ms',
    'uz',
    'it',
    'vi',
    'sr',
    'ko',
    'de',
    'fr',
  ]
  const localeIndex = locales.indexOf(locale)
  return await $fetch(`/api/projectTranslations?locale=${localeIndex}`)
})
