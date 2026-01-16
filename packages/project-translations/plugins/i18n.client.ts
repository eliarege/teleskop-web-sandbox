import { createHooks } from 'hookable'
import { supportedProjectLocales } from '../shared/constants'

function isSupportedLocale(locale: string) {
  return supportedProjectLocales.some(l => l.code === locale)
}

interface ProjectTranslations {
  global: Record<string, string>
  machine: Record<string, Record<string, string>>
}

export default defineNuxtPlugin({
  name: 'project-translations:i18n',
  dependsOn: ['nuxt-base:topbar', 'nuxt-base:keycloak'],
  setup() {
    const kc = useKeycloak()
    const { t } = useNuxtApp().$i18n
    const { registerSettingItem } = useNuxtApp().$topbar
    const hooks = createHooks<{
      newLocale: (locale: string, messages: ProjectTranslations) => void
      updateLocale: (locale: string) => void
    }>()
    const locale = useLocalStorage('projectLocale', supportedProjectLocales[0].code)
    const messages = {} as Record<string, ProjectTranslations>
    const availableLocales = ref<{ id: number, code: string, name: string }[]>([])

    kc.fetch('/api/project-translations/available-locales').then((locales) => {
      availableLocales.value = locales
    })

    watch(locale, async (newLocale) => {
      if (isSupportedLocale(newLocale)) {
        if (!messages[newLocale]) {
          const newMessages = await kc.fetch('/api/project-translations', { query: { locale: newLocale } })
          messages[newLocale] = newMessages
          hooks.callHook('newLocale', newLocale, newMessages)
        }
        hooks.callHook('updateLocale', newLocale)
      }
    }, { immediate: true })

    registerSettingItem(() => ({
      label: t('pt.projectLocale'),
      icon: 'language',
      disabled: !availableLocales.value.length,
      disableReason: t('pt.noLocale'),
      subMenu: {
        offset: [0.5, 0],
        items: [availableLocales.value.map((l) => {
          return {
            label: l.name,
            active: locale.value === l.code,
            onClick: () => locale.value = l.code,
          }
        })],
      },
    }), (item) => {
      return item.name === 'locale-menu' ? 1 : 0
    })

    return {
      provide: {
        projectTranslations: {
          locale,
          locales: readonly(availableLocales),
          messages,
          hooks,
        },
      },
    }
  },
})
