<script setup lang="ts">
import { withBase } from 'ufo'

const { t } = useI18n()

function withHostname(url: string) {
  return url.replace('$hostname', window.location.hostname)
}

const config = useRuntimeConfig()
const appList = useAppList()

const appButtons = appList
  .filter(app => app.name !== 'root')
  .map((app) => {
    return {
      name: app.name,
      label: () => t(`base.apps.${app.name}`),
      url: withHostname(app.url || '/'),
      img: withBase(`/app-icons/${app.img}`, config.app.baseURL),
    }
  })
</script>

<template>
  <div class="text-black !dark:(text-white) relative overflow-hidden">
    <div class="eliar-background z-1" />
    <div class="relative z-2 h-[calc(100vh-41px)] overflow-auto">
      <div class="w-full text-center text-6xl text-bold text-black pt-12 pb-4 z-2 !dark:text-white">
        TELESKOP WEB
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-24 gap-16">
        <NuxtLink
          v-for="app in appButtons"
          :key="app.name"
          :to="app.url"
          external
          class="border-3 dark:border-gray-700 rounded-xl shadow-xl bg-white !hover:bg-gray-100 !dark:(bg-#121212 hover:bg-truegray-800)"
        >
          <div class="flex-center flex-col p-8">
            <img
              :src="app.img"
              width="100"
              height="100"
              class="block"
            >
            <h3 class="text-xl mt-4 text-center">
              {{ toValue(app.label) }}
            </h3>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.eliar-background {
  width: 100%;
  height: calc(100vh - 41px);
  background-image: url(../eliar.svg);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  position: absolute;
  opacity: 0.15;
}
.container {
  @apply flex flex-wrap justify-center items-center gap-8 content-center;
}

.box {
  flex: 0 0 calc(25% - 2rem);
  max-width: calc(33% - 4rem);
  @apply flex-center h-33;
}
</style>
