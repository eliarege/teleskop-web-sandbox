export default defineI18nLocale(async (locale) => {
  const kc = useNuxtApp().$keycloak
  const localeMap: Record<string, number> = {
    'tr': 0,
    'en': 1,
    'ru': 2,
    'fa': 3,
    'fa-Latn': 4,
    'pt': 5,
    'es': 6,
    'ar': 7,
    'zh': 8,
    'zh-Hans': 9,
    'el': 10,
    'ms': 11,
    'uz': 12,
    'it': 13,
    'vi': 14,
    'sr': 15,
    'ko': 16,
    'de': 17,
    'fr': 18,
  }
  const localeIndex = localeMap[locale] ?? localeMap.en
  return await kc.fetch(`/api/project-translations?locale=${localeIndex}`)
})
