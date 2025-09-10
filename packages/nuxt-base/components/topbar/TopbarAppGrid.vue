<script setup lang="ts">
import { withBase } from 'ufo'
import { type AppMeta, useAppList } from '../../composables/useAppList'

const config = useRuntimeConfig()
const appList = useAppList()
const { t } = useI18n()

function withHostname(url: string) {
  return url.replace('$hostname', window.location.hostname)
}

function getCurrentApp() {
  const currentAppUrl = withBase(config.app.baseURL, window.origin)
  let closest = null as AppMeta | null
  let closestDist = 1000
  for (const app of appList) {
    const appUrl = withBase(app.url, window.origin)
    if (currentAppUrl.startsWith(appUrl)) {
      const dist = currentAppUrl.length - appUrl.length
      if (closestDist > dist) {
        closest = app
        closestDist = dist
      }
    }
  }
  return closest
}

const currentApp = getCurrentApp()

const appButtons = appList
  .filter(app => app.name !== 'root' && (!currentApp || currentApp !== app))
  .map((app) => {
    return {
      label: () => t(`base.apps.${app.name}`),
      url: withHostname(app.url || '/'),
      img: withBase(`/app-icons/${app.img}`, config.app.baseURL),
    }
  })
</script>

<template>
  <TopbarButton
    v-show="appButtons.length"
    icon="apps"
    round
  >
    <QTooltip>
      {{ t('base.apps._') }}
    </QTooltip>
    <QMenu :transition-duration="0">
      <div class="grid grid-cols-3 p-2">
        <QBtn
          v-for="(app, index) in appButtons"
          :key="index"
          class="topbar-app-grid__btn py-2 px-5 rounded-lg h-20 max-w-20"
          dense
          flat
          no-caps
          @click="navigateTo(app.url, { external: true })"
        >
          <QImg
            class="block"
            width="2rem"
            height="2rem"
            :src="app.img"
          />
          <div class="whitespace-wrap leading-4 text-xs pt-1">
            {{ toValue(app.label) }}
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
