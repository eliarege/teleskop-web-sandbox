<script setup lang="ts">
defineProps<{
  label?: string
  icon?: string
}>()
</script>

<template>
  <QBtn
    class="px-2"
    :icon
    dense
    :label
    flat
    no-caps
    :ripple="false"
  >
    <slot />
  </QBtn>
</template>
