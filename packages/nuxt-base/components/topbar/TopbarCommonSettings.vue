<script setup lang="ts">
import html2canvas from 'html2canvas-pro'
import AppAboutDialog from '../AppAboutDialog.vue'
import FeedbackBase from './feedback/Base.vue'
import type { FeedbackModel, TopbarMenuItem } from '~/types'
import { mediaDevicesAvailable } from '~/utils/screenshot'
import { sleep } from '~/utils/base'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const keycloak = useKeycloak()

const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const feedback: FeedbackModel = reactive({
  appName: '',
  reportType: '',
  description: '',
  image: '',
})

function feedbackDialog() {
  dialog({
    component: FeedbackBase,
    componentProps: { feedback },
  }).onOk((e: FeedbackModel) => {
    feedback.appName = e.appName
    feedback.description = e.description
    feedback.image = e.image
    feedback.reportType = e.reportType
  })
}

const feedbackEnabled = computed(() => {
  return keycloak.enabled
    && keycloak.authenticated
    && keycloak.tokenParsed.value?.email_verified
    || false
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
