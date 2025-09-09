import type { TranslateOptions } from 'vue-i18n'

export function useProjectTranslations() {
  const { $projectTranslations: pt } = useNuxtApp()
  const { t, locale, fallbackLocale, mergeLocaleMessage } = useI18n({
    useScope: 'local',
    inheritLocale: false,
    locale: pt.locale.value,
    fallbackLocale: pt.fallbackLocale.value,
    messages: pt.messages as Record<string, any>,
  })

  const silentOptions: TranslateOptions = {
    missingWarn: false,
    fallbackWarn: false,
  }

  pt.hooks.hook('newLocale', (loc, msgs) => {
    mergeLocaleMessage(loc, msgs)
    locale.value = loc
  })

  pt.hooks.hook('updateLocale', (loc) => {
    locale.value = loc
  })

  watch(pt.fallbackLocale, (newFallback) => {
    fallbackLocale.value = newFallback
  })

  return {
    locale: readonly(locale),
    locales: pt.locales,
    setLocale(newLocale: string) {
      pt.locale.value = newLocale
    },
    mt(value: string, machineId?: number) {
      if (machineId) {
        return t(
          `machine.${machineId}.${value}`,
          t(`global.${value}`, value, silentOptions),
          silentOptions,
        )
      } else {
        return t(`global.${value}`, value, silentOptions)
      }
    },
  }
}
