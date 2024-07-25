<script setup lang="ts">
interface SettingsExpansionItemProps {
  icon: string
  label: string
  cls: string
}

defineProps<SettingsExpansionItemProps>()
</script>

<template>
  <q-expansion-item
    :class="cls"
    expand-separator
    :icon
    :label
  >
    <slot />
  </q-expansion-item>
</template>

<style scoped lang="postcss">
</style>
