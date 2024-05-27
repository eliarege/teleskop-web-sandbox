<script lang ="ts" setup>
import languageTR from 'quasar/lang/tr'
import { useStateStore } from '~/store/State'

const q = useQuasar()
const state = useStateStore()
const { setLocale } = useI18n()

setLocale(state.locale)

if (state.locale === 'tr')
  q.lang.set(languageTR)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
