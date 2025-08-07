<script setup lang="ts">
import { ref } from 'vue'
import { QBtn } from 'quasar'
import { useContextBarState } from '~/composables/useContextBar'
import { calculateProgramDuration } from '~/shared/formula'

const { contextBarButtons } = useContextBarState()
const editor = useEditorStore()

const el = ref<HTMLElement | null>(null)
const parentEl = ref<HTMLElement | null>(null)

function calcProgramDuration() {
  editor.program.duration = calculateProgramDuration(editor.program, editor.machine, editor.teleskopSettings.initialTemperature)
  return editor.program.duration
}
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
          <QTooltip>
            {{ `${button.tooltip} (${button.shortcut})` }}
          </QTooltip>
        </QBtn>
      </div>
    </div>
  </div>
  <div v-if="editor.program.programNo" class="flex items-center">
    {{ formatDuration(calcProgramDuration()) }}
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
