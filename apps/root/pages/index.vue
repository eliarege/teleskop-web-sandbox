<script setup lang="ts">
const { t } = useI18n()
const appList = useAppList()
const modifiedApplist = computed(() => appList.filter(app => app.name !== 'root'))
</script>

<template>
  <div class="text-black !dark:(text-white)">
    <div class="root absolute -z-3 p-0 m-0" />
    <div class="container max-w-full p-0 m-0 h-[calc(100vh-41px)]">
      <NuxtLink
        v-for="app in modifiedApplist"
        :key="app.name"
        :to="app.url"
        external
        class="box cursor-pointer"
      >
        <div>
          <img
            :src="app.img"
            width="100"
            height="100"
          >
          <span class="w-full h-full flex-center">{{ t(app.name) }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style lang="postcss">
.root {
  width: calc(100vw - 41px);
  height: calc(100vh - 41px);
  background-image: url(../eliar.svg);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.1;
}
.container {
  @apply flex flex-wrap justify-center items-center gap-8 content-center;
}

.box {
  flex: 0 0 calc(25% - 2rem);
  max-width: calc(25% - 2rem);
  @apply flex-center h-33;
}
</style>
