<script setup lang="ts">
const config = useRuntimeConfig()
const { bottomSheet } = useQuasar()

function parseAppList(appList: string): { name: string; url: string }[] {
  try {
    return JSON.parse(appList || '[]') as any[]
  } catch (error) {
    console.warn(`Failed to parse APP_LIST`, error)
    return []
  }
}

const bottomSheetActions = parseAppList(config.public.appList).map((app) => {
  return {
    label: app.name,
    url: app.url,
  }
})
function showBottomsheet() {
  bottomSheet({
    message: '',
    dark: true,
    grid: true,
    actions: bottomSheetActions,
  }).onOk((action) => {
    if (action.url)
      window.location.href = action.url
  })
}
</script>

<template>
  <div>
    <img
      src="/eliar.svg"
      class="z-1 w-full h-10 fixed -bottom-1 flex-center transition-all duration-400 bg-transparent opacity-50 hover:(opacity-100)"
      @click="showBottomsheet"
    >
    <slot />
  </div>
</template>

<style>
</style>
