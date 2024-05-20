<script setup lang="ts">
import type { TopbarMenuProps } from '~/types'

withDefaults(defineProps<TopbarMenuProps>(), {
  anchor: 'bottom left',
  self: 'top start',
})
</script>

<template>
  <QMenu
    :anchor
    :self
    :fit
    :cover
    :offset
    :transition-duration="0"
  >
    <QList>
      <template v-for="(group, index) in items" :key="index">
        <QItem
          v-for="(item, subIndex) in group"
          :key="`${index}-${subIndex}`"
          v-close-popup="!isDefined(item.subMenu)"
          clickable
          dense
          class="q-item-avatar-dense"
          :style="item.style"
          :class="item.class"
          :disable="item.disabled"
          @click="item.onClick"
        >
          <QItemSection>
            <QItemLabel>{{ item.label }}</QItemLabel>
          </QItemSection>
          <QItemSection
            side
            avatar
          >
            <QIcon
              v-show="item.subMenu"
              name="arrow_right"
            />
          </QItemSection>
          <TopbarMenu
            v-if="item.subMenu && !item.disabled"
            anchor="top right"
            :offset="[-1, 0]"
            v-bind="item.subMenu"
          />
        </QItem>
        <QSeparator
          v-if="index !== items.length - 1"
          class="my-1"
        />
      </template>
    </QList>
  </QMenu>
</template>
