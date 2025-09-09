import type { TranslateOptions } from 'vue-i18n'
import { escapeKey } from '../shared/utils'

export function useProjectTranslations() {
  const { $projectTranslations: pt } = useNuxtApp()
  const { t, locale, fallbackLocale, mergeLocaleMessage } = useI18n({
    useScope: 'local',
    inheritLocale: false,
    locale: pt.locale.value,
    fallbackLocale: pt.locale.value,
    messages: pt.messages as Record<string, any>,
  })

  const silentOptions: TranslateOptions = {
    missingWarn: false,
    fallbackWarn: false,
  }

  pt.hooks.hook('newLocale', (loc, msgs) => {
    mergeLocaleMessage(loc, msgs)
    locale.value = loc
    fallbackLocale.value = loc
  })

  pt.hooks.hook('updateLocale', (loc) => {
    locale.value = loc
    fallbackLocale.value = loc
  })

  return {
    locale: readonly(locale),
    locales: pt.locales,
    setLocale(newLocale: string) {
      pt.locale.value = newLocale
    },
    mt(key: string, machineId?: number) {
      const escapedKey = escapeKey(key)
      if (machineId) {
        return t(
          `machine.${machineId}.${escapedKey}`,
          t(`global.${escapedKey}`, key, silentOptions),
          silentOptions,
        )
      } else {
        return t(`global.${escapedKey}`, key, silentOptions)
      }
    },
  }
}
