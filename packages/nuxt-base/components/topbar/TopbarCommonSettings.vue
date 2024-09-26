<script setup lang="ts">
import type { TopbarMenuItem } from '../../types'
import AppAboutDialog from '../AppAboutDialog.vue'
import FeedbackBase from './feedback/Base.vue'
import { checkIfBrowserSupported, takeScreenshot } from '~/utils/screenshot'

interface FeedbackModel {
  username: string
  email: string
  app: {
    name: string
  }
  reportType: string
  description: string
  image: string
}
const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const { dark, dialog } = useQuasar()
const { t, locale, locales, setLocale } = useI18n()
const tt = (key: string) => toRef(() => t(key))

const feedback: FeedbackModel = reactive({
  username: '',
  email: '',
  app: {
    name: '',
  },
  reportType: '',
  description: '',
  image: '',
})

async function screenshot() {
  if (checkIfBrowserSupported()) {
    takeScreenshot().then((screenshot) => {
      feedback.image = screenshot
      feedBackDialog()
    })
  }
}

function feedBackDialog() {
  dialog({
    component: FeedbackBase,
    componentProps: { feedback },
  }).onOk((e: FeedbackModel) => {
    feedback.app.name = e.app.name
    feedback.description = e.description
    feedback.email = e.email
    feedback.image = e.image
    feedback.reportType = e.reportType
    feedback.username = e.username
    screenshot()
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
      onClick: () => feedBackDialog(),
    },
  ],
] as TopbarMenuItem[][]
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
