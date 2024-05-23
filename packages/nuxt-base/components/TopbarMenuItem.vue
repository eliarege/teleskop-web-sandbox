<script setup lang="ts">
import type { TopbarMenuItem } from '../types'

const props = defineProps<{
  item: Omit<TopbarMenuItem, 'style' | 'class'>
}>()

const isDef = (value: unknown) => value != null

const leftIcon = computed(() => {
  if (isDef(props.item.active)) {
    return unref(props.item.active) ? 'check' : undefined
  } else {
    return unref(props.item.icon)
  }
})
</script>

<template>
  <QItem
    v-close-popup="!isDefined(item.subMenu)"
    clickable
    dense
    class="q-item-avatar-dense px-2.5 whitespace-nowrap"
    :disable="unref(item.disabled)"
    :to="item.to"
    @click="item.onClick"
  >
    <QItemSection class="px-0 mr-2.5 opacity-60" avatar>
      <QIcon size="1rem" :name="leftIcon" />
    </QItemSection>
    <QItemSection class="flex-1">
      <QItemLabel>{{ unref(item.label) }}</QItemLabel>
    </QItemSection>
    <QItemSection
      side
      avatar
      class="px-0 ml-10 opacity-60"
    >
      <QIcon
        v-if="item.subMenu"
        name="arrow_right"
      />
      <QItemLabel v-if="!item.subMenu && item.shortcut">
        {{ item.shortcut }}
      </QItemLabel>
    </QItemSection>
    <TopbarMenu
      v-if="item.subMenu && !item.disabled"
      anchor="top right"
      :offset="[-1, 0]"
      v-bind="item.subMenu"
    />
  </QItem>
</template>
