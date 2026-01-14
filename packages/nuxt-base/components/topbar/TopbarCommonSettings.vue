<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n'
import { StorageSerializers, useStorage } from '@vueuse/core'
import AppAboutDialog from '../AppAboutDialog.vue'
import type { TopbarMenuItem } from '../../types'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const feedback = useFeedback()

const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const feedbackAvailable = computed(() => feedback.isAvailable())
const feedbackUnavailableReason = computed(() => feedback.getUnavailableReason())
const appProps = useAppProps()
const darkMode = useStorage<'auto' | boolean>(`${appProps.name}.theme`, false, localStorage, {
  serializer: StorageSerializers.any,
})

watch(darkMode, () => {
  dark.set(darkMode.value)
})

const items = [
  ...(props.extraItems
    ? [props.extraItems]
    : []
  ),
  [
    {
      label: tt('base.locale'),
      icon: 'translate',
      subMenu: {
        offset: [0.5, 0],
        items: [locales.value.map((l: LocaleObject) => {
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
  [
    {
      label: tt('base.aboutApp'),
      icon: 'help_outline',
      onClick: () => dialog({ component: AppAboutDialog }),
    },
    {
      label: tt('base.sendFeedback'),
      icon: 'feedback',
      shortcut: 'F9',
      disabled: () => !feedbackAvailable.value,
      disableReason: feedbackUnavailableReason,
      onClick: () => feedback.showDialog(),
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
