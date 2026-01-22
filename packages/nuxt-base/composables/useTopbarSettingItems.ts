import type { TopbarMenuItem } from '~/types'

export function useTopbarSettingItems(options?: {
  disableTheme?: boolean
  extraItems?: TopbarMenuItem[]
}) {
  const topbar = useNuxtApp().$topbar

  function removeTheme(groups: TopbarMenuItem[][]) {
    return groups
      .map(group => group.filter(item => item.name === 'theme-menu'))
      .filter(group => group.length > 0)
  }

  const items = computed(() => {
    const settingItems = topbar.settingItems.value.map(group => [...group])
    if (options?.disableTheme) {
      removeTheme(settingItems)
    }
    return [
      options?.extraItems ? [...options.extraItems] : [],
      ...settingItems,
    ]
  })

  return { items }
}
