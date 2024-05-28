<script setup lang="ts">
import type { TopbarMenuItem } from '../types'
import AppAboutDialog from '../AppAboutDialog.vue'

const props = defineProps<{
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const items = [
  [
    {
      label: tt('base.locale'),
      icon: 'translate',
      subMenu: {
        offset: [2, 0],
        items: [locales.value.map((l) => {
          return {
            label: l.name,
            active: locale.value === l.code,
            onClick: () => setLocale(l.code),
          }
        })],
      },
    },
    {
      label: tt('base.theme._'),
      icon: 'palette',
      disabled: props.disableTheme,
      subMenu: {
        offset: [2, 0],
        items: [[
          {
            label: t('base.theme.device'),
            active: dark.mode === 'auto',
            onClick: () => dark.set('auto'),
          },
          {
            label: t('base.theme.light'),
            active: dark.mode === false,
            onClick: () => dark.set(false),
          },
          {
            label: t('base.theme.dark'),
            active: dark.mode === true,
            onClick: () => dark.set(true),
          },
        ]],
      },
    },
  ],
  [
    {
      label: tt('base.aboutApp'),
      icon: 'help_outline',
      onClick: () => dialog({ component: AppAboutDialog }),
    },
    {
      label: tt('base.sendFeedback'),
      icon: 'feedback',
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
