<script setup lang="ts">
import { ref, watch } from 'vue'
import { QBtn } from 'quasar'
import { useElementSize } from '@vueuse/core'
import { useContextBarState } from '~/composables/useContextBar'

const { contextBarButtons } = useContextBarState()
const editor = useEditorStore()

const el = ref<HTMLElement | null>(null)
const parentEl = ref<HTMLElement | null>(null)
const width = ref(useElementSize(el).width)
const parentWidth = ref(useElementSize(parentEl).width)
const defaultWidth = ref(0)

watch([width, parentWidth, defaultWidth], () => {
  defaultWidth.value = width.value > defaultWidth.value ? width.value : defaultWidth.value

  if (parentWidth.value < (defaultWidth.value + 50)) {
    contextBarButtons.value.forEach((button: any) => {
      button.label = ''
    })
  } else {
    contextBarButtons.value.forEach((button: any) => {
      button.label = button.originalLabel
    })
  }
})
</script>

<template>
  <QBtn
    class="text-gray-6 dark:text-gray-3"
    icon="menu"
    square
    flat
    @click="editor.leftDrawerOpen = !editor.leftDrawerOpen"
  />
  <div class="flex-grow-1">
    <div ref="parentEl" class="flex">
      <div ref="el">
        <QBtn
          v-for="(button, index) in contextBarButtons"
          :key="index"
          :disable="button.disable"
          square
          flat
          class="icon-left"
          @click="button.onClick"
        >
          <QIcon
            :name="button.icon"
            size="1.2rem"
          />
          <span class="pl-1">{{ button.label }}</span>
          <QTooltip>
            {{ button.label !== '' ? button.shortcut : `${button.tooltip} (${button.shortcut})` }}
          </QTooltip>
        </QBtn>
      </div>
    </div>
  </div>
  <QBtn
    class="text-gray-6 dark:text-gray-3"
    icon="menu"
    square
    flat
    @click="editor.rightDrawerOpen = !editor.rightDrawerOpen"
  />
</template>

<style lang="postcss" scoped>
.q-btn {
  @apply text-transform: capitalize;
  @apply color: color-gray-7;
  @apply dark:(color-gray-3);
}
</style>
