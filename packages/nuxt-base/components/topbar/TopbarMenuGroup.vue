<script setup lang="ts" generic="T">
const props = defineProps<{
  items: T[][]
}>()
defineSlots<{
  default: (props: { item: T }) => any
}>()

const nonEmptyGroups = computed(() => {
  return props.items.filter(group => group.length > 0)
})
</script>

<template>
  <template v-for="(group, index) in nonEmptyGroups" :key="index">
    <QList>
      <template
        v-for="(item, subIndex) in group"
        :key="`${index}-${subIndex}`"
      >
        <slot :item="item" />
      </template>
    </QList>
    <QSeparator
      v-if="index !== nonEmptyGroups.length - 1"
      class="my-1"
    />
  </template>
</template>
