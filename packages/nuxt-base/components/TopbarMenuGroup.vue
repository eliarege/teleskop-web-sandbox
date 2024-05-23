<script setup lang="ts" generic="T">
defineProps<{
  items: T[][]
}>()
defineSlots<{
  default: (props: { item: T }) => any
}>()
</script>

<template>
  <template v-for="(group, index) in items" :key="index">
    <QList>
      <template
        v-for="(item, subIndex) in group"
        :key="`${index}-${subIndex}`"
      >
        <slot :item="item" />
      </template>
    </QList>
    <QSeparator
      v-if="index !== items.length - 1"
      class="my-1"
    />
  </template>
</template>
