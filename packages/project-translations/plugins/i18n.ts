import { createHooks } from 'hookable'
import { supportedProjectLocales } from '../shared/constants'

function isSupportedLocale(locale: string) {
  return supportedProjectLocales.some(l => l.code === locale)
}

interface ProjectTranslations {
  global: Record<string, string>
  machine: Record<string, Record<string, string>>
}

export default defineNuxtPlugin(() => {
  const kc = useKeycloak()
  const hooks = createHooks<{
    newLocale: (locale: string, messages: ProjectTranslations) => void
    updateLocale: (locale: string) => void
  }>()
  const locale = ref(supportedProjectLocales[0].code)
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
})
