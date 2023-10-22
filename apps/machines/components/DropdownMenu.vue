<script setup lang="ts">
import { ref, watch } from 'vue'
import { flip, shift, useFloating } from '@floating-ui/vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
import type { Placement } from '@floating-ui/vue'

interface DropdownItem {
  label: string
  to: string
  icon?: string
  placement?: Placement
  items?: DropdownItem[]
  onClick?: (item: DropdownItem) => any
}
interface DropdownProps {
  model: DropdownItem
  placement: Placement
  secondPlacement: Placement
  strategy: 'fixed' | 'absolute'
  depth?: number
}
const props = withDefaults(defineProps<DropdownProps>(), {
  depth: 0,
})
const emit = defineEmits(['close'])
defineSlots<{
  default(props: { active: boolean; item: DropdownItem; depth: number }): any
}>()
const router = useRouter()
const open = ref(false)
const reference = ref(null)
const floating = ref(null)
const middleware = [flip(), shift()]
const { floatingStyles, update } = useFloating(reference, floating, {
  placement: props.placement,
  strategy: props.strategy,
  middleware,
})
const { width: screenWidth } = useWindowSize()
watch(screenWidth, () => update())
function goTo(path?: string) {
  if (path) {
    router.push(path)
    open.value = false
    emit('close')
  }
}
function onClick() {
  open.value = false
  emit('close')
}
</script>

<template>
  <div
    class="select-none"
    @mouseover="open = true"
    @mouseleave="open = false"
    @click.stop="goTo(model.to)"
  >
    <div ref="reference">
      <slot
        :item="model"
        :active="open"
        :depth="depth"
      />
    </div>
    <div
      v-if="model.items && open"
      ref="floating"
      :style="floatingStyles"
    >
      <DropdownMenu
        v-for="(item, idx) in model.items"
        :key="idx"
        :strategy="strategy"
        :placement="secondPlacement"
        :second-placement="secondPlacement"
        :model="item"
        :depth="depth + 1"
        @close="onClick"
      >
        <template #default="{ item, active, depth }">
          <slot
            :item="item"
            :active="active"
            :depth="depth"
          />
        </template>
      </DropdownMenu>
    </div>
  </div>
</template>
