<script lang ="ts" setup>
import { useStateStore } from '~/store/State'

const state = useStateStore()
const { locale } = useI18n()
locale.value = state.locale

</script>

<template>
  <NuxtLayout/>
</template>
