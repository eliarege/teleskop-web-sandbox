<script setup lang="ts">
withDefaults(defineProps<{
  items: {
    color: string
    label: string
  }[]
  direction?: 'vertical' | 'horizontal'
}>(), {
  items: () => [],
  direction: 'vertical',
})
</script>

<template>
  <ul class="flex-center gap-2 h-min w-min text-extra-small whitespace-nowrap">
    <li
      v-for="(item, index) in items"
      :key="index"
      class="flex-center gap-1"
    >
      <span class="w-3 h-3 rounded inline-block align-middle" :style="{ backgroundColor: item.color }" />
      <span>{{ item.label }}</span>
    </li>
  </ul>
</template>

<style scoped>
.text-extra-small {
  font-size: 0.65rem;
}
</style>
