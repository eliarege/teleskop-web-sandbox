<script setup lang="ts">
import { withBase } from 'ufo'

const config = useRuntimeConfig()
const { bottomSheet } = useQuasar()

// TODO: Applications should be fetched from an external meta service
function parseAppList(appList: unknown): { name: string, url: string, img: string }[] {
  if (typeof appList === 'string') {
    try {
      return JSON.parse(appList || '[]') as any[]
    } catch (error) {
      console.warn(`Failed to parse APP_LIST`, error)
      return []
    }
  } else if (Array.isArray(appList)) {
    return appList
  } else {
    if (appList)
      console.warn(`Unexpected APP_LIST value`, appList)
    return []
  }
}

function withHostname(url: string) {
  return url.replace('$hostname', window.location.hostname)
}

const appList = parseAppList(config.public.appList)

const bottomSheetActions = appList.map((app) => {
  return {
    label: app.name,
    url: withHostname(app.url),
    img: withBase(`/app-icons/${app.img}`, config.app.baseURL),
  }
})

function showBottomsheet() {
  bottomSheet({
    dark: true,
    grid: true,
    actions: bottomSheetActions,
  }).onOk((action) => {
    if (action.url) {
      navigateTo(action.url, {
        external: true,
      })
    }
  })
}
</script>

<template>
  <QPageSticky position="bottom">
    <QBtn
      rounded
      flat
      class="!p-0 opacity-20 hover:opacity-100 hover:bg-transparent"
      transition="opacity duration-200"
      @click="showBottomsheet"
    >
      <Icon name="IconEliar" size="2.5rem" />
    </QBtn>
  </QPageSticky>
</template>
