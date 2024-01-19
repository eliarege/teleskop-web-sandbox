<script setup lang="ts">
const config = useRuntimeConfig()
const { bottomSheet } = useQuasar()

function parseAppList(appList: unknown): { name: string; url: string; img: string }[] {
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

function withHost(url: string) {
  return url.replace('$host', window.location.hostname)
}

const appList = parseAppList(config.public.appList)

const bottomSheetActions = appList.map((app) => {
  return {
    label: app.name,
    url: withHost(app.url),
    img: `/app-icons/${app.img}`,
  }
})

function showBottomsheet() {
  bottomSheet({
    message: '',
    dark: true,
    grid: true,
    actions: bottomSheetActions,
  }).onOk((action) => {
    if (action.url) {
      const host = new URL(action.url).host
      if (window.location.host !== host)
        window.location.href = action.url
    }
  })
}
</script>

<template>
  <div>
    <img
      v-show="appList.length"
      src="/eliar.svg"
      class="z-1 w-full h-10 fixed -bottom-1 flex-center transition-all duration-400 bg-transparent opacity-50 hover:(opacity-100)"
      @click="showBottomsheet"
    >
    <slot />
  </div>
</template>

<style>
.q-bottom-sheet__item {
  text-align: center;

  & img {
    display: inline-block;
  }
}
</style>
