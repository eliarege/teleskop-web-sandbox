<script lang ="ts" setup>
import languageTR from 'quasar/lang/tr'
import { useStateStore } from '~/store/State'

const q = useQuasar()
const state = useStateStore()
const { setLocale, t } = useI18n()

useHead({
  title: () => t('app.name'),
})

setLocale(state.locale)

if (state.locale === 'tr')
  q.lang.set(languageTR)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
