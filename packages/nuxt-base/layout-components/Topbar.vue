<script setup lang="ts">
import type { TopBarItem, TopBarItemStyle } from '../types/topbar'
import TopbarMenuBlock from '../layout-components/TopbarMenuBlock.vue'
import NavigationTopRightButtons from '../layout-components/NavigationTopRightButtons.vue'
import EliarIcon from '../layout-components/EliarIcon.vue'

import { useRoute } from '#imports'

const props = defineProps<{
  items: Array<TopBarItem>
  useNavbar?: boolean | false
  customItemStyle?: TopBarItemStyle
  customItemClass?: string
  customSelectedItemClass?: string
  customTopbarClass?: string
  customTopbarStyle?: string

}>()
const route = useRoute()

function checkIsRouteContains(str: string) {
  if (!props.useNavbar)
    return false
  if (str === '/' && str !== route.fullPath)
    return false
  return route.fullPath.includes(str)
}

function topBarClassHandler(isSelected: boolean) {
  if (!isSelected)
    return props?.customItemClass
  return props?.customSelectedItemClass
}
function topBarStyleHandler(isSelected: boolean) {
  const styleObject: any = {
    fontSize: props?.customItemStyle?.fontSize || 'large',
  }
  if (isSelected) {
    styleObject.backgroundColor = props?.customItemStyle?.selectedBgColor || 'white'
    styleObject.color = props?.customItemStyle?.selectedTextColor || 'black'
  } else {
    styleObject.backgroundColor = props?.customItemStyle?.bgColor || 'black'
    styleObject.color = props?.customItemStyle?.textColor || 'white'
  }
  return styleObject
}
</script>

<template>
  <div class="bg-black flex items-center" :class="customTopbarClass" :style="customTopbarStyle">
    <slot name="left">
      <EliarIcon v-if="props.useNavbar" />
    </slot>

    <div class="flex ml-5" :style="`gap: ${customItemStyle?.gap || '1.25rem'}`">
      <TopbarMenuBlock
        v-for="(item, index) in items"
        :key="index"
        :model="item"
        class="z-10 flex"
      >
        <template #default="{ item: subItem, depth }">
          <div
            v-if="depth === 0"
            :class="topBarClassHandler(checkIsRouteContains(item.route!))"
            :style="topBarStyleHandler(checkIsRouteContains(item.route!))"
            class="
                  cursor-pointer whitespace-nowrap
                  text-lg text-center
                  rounded p-1 lg:px-3 xl:px-4 transition-all
                  h-full flex
                  "
          >
            {{ item.label }}
          </div>
          <div
            v-else
            :style="`font-size: ${customItemStyle?.fontSize ? customItemStyle?.fontSize : 'medium'}`"
            class="
                  w-full cursor-pointer bg-white text-black
                  border px-3 mx-1 py-2 flex items-center
                  justify-between whitespace-nowrap
                  hover:(!bg-light-400 !text-gray-800)
                  "
          >
            {{ subItem.label }}
            <q-icon
              v-if="subItem.children"
              name="chevron_right"
            />
          </div>
        </template>
      </TopbarMenuBlock>
    </div>
    <q-space />
    <slot name="right">
      <NavigationTopRightButtons v-if="props.useNavbar" />
    </slot>
  </div>
</template>

<style scoped>
</style>
