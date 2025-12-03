<script setup lang="ts">
import { QBtn } from 'quasar'
import { useContextBarState } from '~/composables/useContextBar'
import { calculateProgramDuration } from '~/shared/formula'

const $q = useQuasar()
const { contextBarButtons } = useContextBarState()
const editor = useEditorStore()

function calcProgramDuration() {
  const { machine, program, teleskopSettings: { initialTemperature } } = editor

  editor.program.duration = calculateProgramDuration(
    program,
    machine,
    initialTemperature,
  )

  return editor.program.duration
}

const visibleContextBarButtons = computed(() =>
  contextBarButtons.value.filter(btn => btn.visible !== false),
)

function isScreenGtMd() {
  return $q.screen.gt.md
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

  <div class="flex">
    <QBtn
      v-for="(button, index) in visibleContextBarButtons"
      :key="index"
      :disable="button.disable"
      :label="isScreenGtMd() ? button.label : undefined"
      :dense="isScreenGtMd()"
      :icon="button.icon"
      class="mx-1"
      flat
      style="font-size: 0.8rem"
      @click="button.onClick"
    >
      <QTooltip>
        {{ button.tooltip }}
        <span v-if="button.shortcut"> ({{ button.shortcut }})</span>
      </QTooltip>
    </QBtn>
  </div>

  <q-space />

  <div v-if="editor.program.programNo" class="flex items-center px-2">
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
