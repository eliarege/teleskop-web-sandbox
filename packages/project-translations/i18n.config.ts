// Disable warnings for missing machine translations
const NOT_MACHINE_TRANSLATION_RE = /^(?!mt\.(\d)+\..+).*$/

export default defineI18nConfig(() => ({
  missingWarn: NOT_MACHINE_TRANSLATION_RE,
  fallbackWarn: NOT_MACHINE_TRANSLATION_RE,
}))
