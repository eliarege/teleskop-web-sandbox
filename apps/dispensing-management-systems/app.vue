<script lang ="ts" setup>
import { useStateStore } from '~/store/State'

const state = useStateStore()
const { setLocale } = useI18n()

setLocale(state.locale)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
