<script setup lang="ts">
// TODO: version can't stay like this
const ver = ref('v0.1')
useHead({
  title: `Eliar Kontrol Merkezi ${ver.value}`,
  link: [
    { rel: 'icon', type: 'image/svg', href: '/logo-dark-raw.svg' },
  ],
})
</script>

<template>
  <div>
    <slot />
  </div>
</template>
