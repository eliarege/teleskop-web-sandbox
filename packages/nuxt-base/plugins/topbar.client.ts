import { StorageSerializers } from '@vueuse/core'
import AppAboutDialog from '../components/AppAboutDialog.vue'
import type { TopbarMenuItem } from '../types'

type DecidePlacement =
  | -1 // before item
  | 1 // after item
  | 0 // continue

export default defineNuxtPlugin({
  name: 'nuxt-base:topbar',
  setup() {
    const { t, locale, locales, setLocale } = useNuxtApp().$i18n
    const { dark, dialog } = useQuasar()
    const appProps = useAppProps()
    const darkMode = useLocalStorage<'auto' | boolean>(`${appProps.name}.theme`, false, {
      serializer: {
        read: (v: string) => {
          if (v === 'auto') return 'auto'
          return v === 'true'
        },
        write: (v) => `${v}`,
      }
    })

    watch(darkMode, () => {
      dark.set(darkMode.value)
    }, { immediate: true })

    type RegisteredItem = {
      getter: () => TopbarMenuItem
      decide?: (item: TopbarMenuItem) => DecidePlacement
    }

    const registry = [] as RegisteredItem[]

    const defaultItems = (nonDecideGroup: TopbarMenuItem[]): TopbarMenuItem[][] => [
      [
        {
          label: t('base.locale'),
          icon: 'translate',
          name: 'locale-menu',
          subMenu: {
            offset: [0.5, 0],
            items: [locales.value.map((l) => {
              return {
                label: l.name || l.code,
                active: locale.value === l.code,
                onClick: () => setLocale(l.code),
              }
            })],
          },
        },
        {
          label: t('base.theme._'),
          name: 'theme-menu',
          icon: 'palette',
          subMenu: {
            offset: [0.5, 0],
            items: [[
              {
                label: t('base.theme.device'),
                active: dark.mode === 'auto',
                onClick: () => darkMode.value = 'auto',
              },
              {
                label: t('base.theme.light'),
                active: dark.mode === false,
                onClick: () => darkMode.value = false,
              },
              {
                label: t('base.theme.dark'),
                active: dark.mode === true,
                onClick: () => darkMode.value = true,
              },
            ]],
          },
        },
      ],
      nonDecideGroup,
      [
        {
          label: t('base.aboutApp'),
          name: 'about-app',
          icon: 'help_outline',
          onClick: () => dialog({ component: AppAboutDialog }),
        },
      ],
    ]

    let renderedOnce = false

    function renderSettingItems(): TopbarMenuItem[][] {
      const nonDecideGroup: TopbarMenuItem[] = []
      const items = defaultItems(nonDecideGroup)
      for (const reg of registry) {
        renderRegisteredItem(reg, items, nonDecideGroup)
      }
      renderedOnce = true
      return items
    }

    function renderRegisteredItem(
      item: RegisteredItem,
      settingItems: TopbarMenuItem[][],
      nonDecideGroup: TopbarMenuItem[],
    ) {
      interface RecurseResult {
        parent: TopbarMenuItem[]
        index: number
        isBefore: boolean
      }

      const recurse = (items: TopbarMenuItem[], decide: (item: TopbarMenuItem) => DecidePlacement): RecurseResult | null => {
        for (let i = 0; i < items.length; i++) {
          const it = items[i]
          const placement = decide(it)
          if (placement === 0) {
            if (it.subMenu) {
              const result = recurse(it.subMenu.items.flat(), decide)
              if (result) {
                return result
              }
            }
            continue
          } else {
            return {
              parent: items,
              index: i,
              isBefore: placement === -1,
            }
          }
        }
        return null
      }

      if (item.decide) {
        for (const group of settingItems) {
          const result = recurse(group, item.decide)
          if (result) {
            if (result.isBefore) {
              result.parent.splice(result.index, 0, item.getter())
            } else {
              result.parent.splice(result.index + 1, 0, item.getter())
            }
            return
          }
        }
      }
      nonDecideGroup.push(item.getter())
    }

    function registerSettingItem(
      getter: () => TopbarMenuItem,
      decide?: (item: TopbarMenuItem) => DecidePlacement,
    ) {
      if (import.meta.dev && renderedOnce) {
        console.warn('[nuxt-base:topbar] Registered a setting item after the first render.')
      }
      registry.push({ getter, decide })
    }

    const settingItems = computed(() => renderSettingItems())

    return {
      provide: {
        topbar: {
          settingItems,
          registerSettingItem,
        },
      },
    }
  },
})
