<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: string
  color?: string
}>(), {
  size: '1em',
})
</script>

<template>
  <div :style="{ width: size, height: size }">
    <div
      class="w-full h-full"
      :class="name"
      :style="{ color }"
    />
  </div>
</template>
