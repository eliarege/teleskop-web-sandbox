<script setup lang="ts">
import AppAboutDialog from '../AppAboutDialog.vue'
import TopbarFeedbackDialog from './feedback/TopbarFeedbackDialog.vue'
import type { FeedbackModel, TopbarMenuItem } from '~/types'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const keycloak = useKeycloak()

const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))
const { data: properties } = await useFetch('/api/properties')
const feedback: FeedbackModel = reactive({
  appName: properties.value.name,
  reportType: '',
  description: '',
  image: '',
})
const feedbackEnabled = computed(() => {
  return keycloak.enabled
    && keycloak.authenticated
    && keycloak.tokenParsed.value?.email_verified
    || false
})

const feedbackDisableReason = computed(() => {
  return !keycloak.tokenParsed.value.email_verified ? 'feedback.mail-not-verified' : null
})

function feedbackDialog() {
  dialog({
    component: TopbarFeedbackDialog,
    componentProps: { feedback, feedbackEnabled: feedbackEnabled.value },
  }).onOk((e: FeedbackModel) => {
    feedback.appName = e.appName
    feedback.description = e.description
    feedback.image = e.image
    feedback.reportType = e.reportType
  })
}

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
      disabled: () => !feedbackEnabled.value,
      disableReason: feedbackDisableReason.value,
      onClick: () => feedbackDialog(),
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
