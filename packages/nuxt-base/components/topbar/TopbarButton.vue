<script setup lang="ts">
defineProps<{
  label?: string
  icon?: string
  round?: boolean
}>()
</script>

<template>
  <QBtn
    class="px-3 h-10"
    :class="round ? 'h-unset' : ''"
    :icon
    :round
    dense
    :label
    flat
    no-caps
    :ripple="false"
  >
    <slot />
  </QBtn>
</template>
