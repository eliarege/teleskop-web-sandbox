<script setup lang="ts">
import { useQuasar } from 'quasar'

const config = useRuntimeConfig()
function tryParse(appList: string) {
  try {
    return JSON.parse(appList) as any[]
  } catch (error) {
    console.warn(error)
    return []
  }
}
const { bottomSheet } = useQuasar()
const bottomSheetActions = tryParse(config.public.appList).map((app) => {
  return {
    label: app.name,
    url: app.url,
  }
})
function showBottomsheet() {
  return bottomSheet({
    message: '',
    dark: true,
    grid: true,
    actions: bottomSheetActions,
  }).onOk((nav) => {
    window.location.href = nav.url
  })
}
</script>

<template>
  <img
    src="./eliar-logo.svg"
    class="z-1 w-full h-10 fixed -bottom-1 flex-center transition-all duration-400 bg-transparent opacity-50 hover:(opacity-100)"
    @click="showBottomsheet()"
  >
  <slot />
</template>

<style>
</style>
