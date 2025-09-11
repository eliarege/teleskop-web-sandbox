<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n'
import { StorageSerializers, useStorage } from '@vueuse/core'
import AppAboutDialog from '../../nuxt-base/components/AppAboutDialog.vue'
import type { TopbarMenuItem } from '../../nuxt-base/types'
import { useProjectTranslations } from '#imports'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()

const { dark, dialog } = useQuasar()
const nuxt = useNuxtApp()

const pt = useProjectTranslations()
const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const feedbackEnabled = computed(() => nuxt.$feedback.isEnabled() === true)
const feedbackDisableReason = computed(() => nuxt.$feedback.isEnabled())
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
      label: tt('pt.projectLocale'),
      icon: 'language',
      disabled: () => !pt.locales.value.length,
      disableReason: tt('pt.noLocale'),
      subMenu: {
        offset: [0.5, 0],
        items: [pt.locales.value.map((l: LocaleObject) => {
          return {
            label: l.name,
            active: pt.locale.value === l.code,
            onClick: () => pt.setLocale(l.code),
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
      disabled: () => !feedbackEnabled.value,
      disableReason: feedbackDisableReason,
      onClick: () => nuxt.$feedback.showDialog(),
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
