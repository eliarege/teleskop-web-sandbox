<script setup lang="ts">
import { computed, ref } from 'vue'
import { QBtn, QTooltip } from 'quasar'
import { useResizeObserver } from '@vueuse/core'
import { useContextBarState } from '~/composables/useContextBar'
import { calculateProgramDuration } from '~/shared/formula'

const { contextBarButtons } = useContextBarState()
const editor = useEditorStore()

const visibleContextBarButtons = computed(() =>
  contextBarButtons.value.filter(btn => btn.visible !== false),
)

function calcProgramDuration() {
  const { machine, program, teleskopSettings: { initialTemperature } } = editor

  return (editor.program.duration = calculateProgramDuration(
    program,
    machine,
    initialTemperature,
  ))
}

// Button Label Auto-Hide Logic
const container = useTemplateRef('container')
const buttons = useTemplateRef('buttons')

const showLabels = ref(true)
let openButtonWidth = 0

useResizeObserver(container, () => {
  if (!container.value || !buttons.value)
    return

  if (showLabels.value)
    openButtonWidth = buttons.value.scrollWidth

  showLabels.value = openButtonWidth < container.value.clientWidth
})
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <!-- LEFT SIDE -->
    <div class="flex flex-1 items-center">
      <!-- Left Drawer Button -->
      <QBtn
        class="text-gray-6 dark:text-gray-3"
        icon="menu"
        square
        flat
        @click="editor.leftDrawerOpen = !editor.leftDrawerOpen"
      />

      <!-- Button Container -->
      <div ref="container" class="flex flex-1 items-center overflow-hidden">
        <div ref="buttons" class="flex items-center whitespace-nowrap">
          <!-- Context Buttons -->
          <QBtn
            v-for="(button, index) in visibleContextBarButtons"
            :key="index"
            :disable="button.disable"
            :label="showLabels ? button.label : undefined"
            :dense="showLabels"
            :icon="button.icon"
            class="mx-1 text-3"
            flat
            @click="button.onClick"
          >
            <QTooltip>
              {{ button.tooltip }}
              <span v-if="button.shortcut">({{ button.shortcut }})</span>
            </QTooltip>
          </QBtn>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="flex items-center justify-end">
      <div
        v-if="editor.program.programNo"
        class="flex items-center px-2"
      >
        {{ formatDuration(calcProgramDuration()) }}
      </div>

      <!-- Right Drawer Button -->
      <QBtn
        class="text-gray-6 dark:text-gray-3"
        icon="menu"
        square
        flat
        @click="editor.rightDrawerOpen = !editor.rightDrawerOpen"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.q-btn {
  @apply text-transform: capitalize;
  @apply color-gray-7 dark:color-gray-3;
}
</style>
