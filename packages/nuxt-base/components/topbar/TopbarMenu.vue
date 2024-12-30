<script setup lang="ts">
import type { TopbarMenuItem, TopbarMenuProps } from '../../types'

const props = withDefaults(defineProps<TopbarMenuProps>(), {
  anchor: 'bottom left',
  self: 'top start',
})
const key = '__parentMenuItem__'

const parentItem = inject<Pick<TopbarMenuProps, 'itemClass' | 'itemStyle'>>(key, {
  itemClass: undefined,
  itemStyle: undefined,
})
const itemClass = computed(() => [parentItem.itemClass, props.itemClass])
const itemStyle = computed(() => [parentItem.itemStyle, props.itemClass])

function computeItemClass(item: TopbarMenuItem) {
  return [itemClass.value, toValue(item.class)]
}

function computeItemStyle(item: TopbarMenuItem) {
  return [itemStyle.value, toValue(item.style)]
}

provide(key, reactive({
  itemStyle,
  itemClass,
}))
</script>

<template>
  <QMenu
    :anchor
    :self
    :fit
    :cover
    :offset
    :transition-duration="0"
    class="select-none"
  >
    <TopbarMenuGroup v-slot="{ item }" :items="items">
      <TopbarMenuItem
        :item="item"
        :style="computeItemStyle(item)"
        :class="computeItemClass(item)"
      />
    </TopbarMenuGroup>
  </QMenu>
</template>
