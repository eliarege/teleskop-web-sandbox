<script setup lang="ts">
const route = useRoute()
const appList = useAppList()
const rootUrl = appList.find(a => a.name === 'root')?.url

const homeUrl = computed(() => {
  if (route.path === '/' && rootUrl) {
    return { to: rootUrl, external: true }
  } else {
    return { to: '/', external: false }
  }
})
</script>

<template>
  <NuxtLink :to="homeUrl.to" :external="homeUrl.external">
    <TwIcon
      name="i-tw:eliar"
      size="2.5rem"
      class="p-1"
    />
  </NuxtLink>
</template>
