<script setup lang="ts">
defineProps<{
  label?: string
  icon?: string
}>()
</script>

<template>
  <QBtn
    class="px-3 h-10"
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
