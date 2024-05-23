<script setup lang="ts">
import { withBase } from 'ufo'

const config = useRuntimeConfig()

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

const appList = parseAppList(config.public.appList).map((app) => {
  return {
    label: app.name,
    url: withHostname(app.url),
    img: withBase(`/app-icons/${app.img}`, config.app.baseURL),
  }
})
</script>

<template>
  <TopbarButton
    v-show="appList.length"
    icon="apps"
    class="h-unset"
    round
  >
    <QMenu :offset="[0, 5]">
      <div class="grid grid-cols-3 p-2">
        <QBtn
          v-for="(app, index) in appList"
          :key="index"
          class="topbar-app-grid__btn p-2 rounded-lg h-20 max-w-20"
          dense
          flat
          no-caps
          @click="navigateTo(app.url, { external: true })"
        >
          <QImg
            class="inline-block"
            width="2rem"
            height="2rem"
            t
            :src="app.img"
          />
          <div class="whitespace-wrap leading-4 text-xs pt-1">
            {{ app.label }}
          </div>
        </QBtn>
      </div>
    </QMenu>
  </TopbarButton>
</template>

<style lang="postcss">
.topbar-app-grid__btn .q-btn__content {
  flex: 0;
}
</style>
