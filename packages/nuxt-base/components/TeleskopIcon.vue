<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  size?: string
  cls?: string
}>(), {
  size: '20px',
})
</script>

<template>
  <i :class="`${name}`" :style="{ width: size, height: size }" />
</template>

<style scoped>
</style>
