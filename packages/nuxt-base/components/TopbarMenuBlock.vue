<script setup lang="ts">
import { ref, watch } from 'vue'
import { flip, shift, useFloating } from '@floating-ui/vue'
import { useWindowSize } from '@vueuse/core'
import type { TopBarItem } from '../types/topbar'

interface TopBarProps {
  model: TopBarItem
  strategy?: 'fixed' | 'absolute'
  depth?: number
}

const props = withDefaults(defineProps<TopBarProps>(), {
  depth: 0,
  strategy: 'fixed',
})

const emit = defineEmits(['close'])
defineSlots<{
  default(props: { active: boolean, item: TopBarItem, depth: number }): any
}>()
const open = ref(false)
const reference = ref(null)
const floating = ref(null)
const middleware = [flip(), shift()]
const { floatingStyles, update } = useFloating(reference, floating, {
  placement: props.depth === 0 ? 'bottom-start' : 'right-start',
  strategy: props.strategy,
  middleware,
})
const { width: screenWidth } = useWindowSize()
watch(screenWidth, () => update())

function handleClick() {
  const { model } = props
  if (!model.disabled) {
    model.onClick?.()
    if (model.route) {
      navigateTo(model.route)
    }
    close()
  }
}

function close() {
  open.value = false
  emit('close')
}
</script>

<template>
  <div
    class="select-none"
    @mouseover="open = true"
    @mouseleave="open = false"
    @click.stop="handleClick"
  >
    <div ref="reference">
      <slot
        :item="model"
        :active="open"
        :depth="depth"
      />
    </div>
    <div
      v-if="model.children && open"
      ref="floating"
      :style="floatingStyles"
    >
      <TopbarMenuBlock
        v-for="(item, idx) in model.children"
        :key="idx"
        :strategy="strategy"
        :model="item"
        :depth="depth + 1"
        @close="close"
      >
        <template #default="slotProps">
          <slot
            :item="slotProps.item"
            :active="slotProps.active"
            :depth="slotProps.depth"
          />
        </template>
      </TopbarMenuBlock>
    </div>
  </div>
</template>
