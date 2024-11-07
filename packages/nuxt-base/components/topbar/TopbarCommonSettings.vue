<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n'
import AppAboutDialog from '../AppAboutDialog.vue'
import type { TopbarMenuItem } from '~/types'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const keycloak = useKeycloak()
const nuxt = useNuxtApp()

const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const feedbackEnabled = computed(() => {
  return keycloak.enabled
    && keycloak.authenticated.value
    && keycloak.tokenParsed.value?.email_verified
    || false
})

const feedbackDisableReason = computed(() => {
  if (!feedbackEnabled.value) {
    if (!keycloak.enabled)
      return t('feedback.response.no-auth')
    if (!keycloak.authenticated.value)
      return t('feedback.response.auth-required')
    if (keycloak.tokenParsed.value?.email_verified === false)
      return t('feedback.response.email-not-verified')
  }
  return null
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
      shortcut: 'F9',
      disabled: () => !feedbackEnabled.value,
      disableReason: feedbackDisableReason,
      onClick: () => nuxt.$showFeedbackDialog(),
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
