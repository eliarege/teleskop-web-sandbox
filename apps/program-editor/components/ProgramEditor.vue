<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from 'utils'
import type { AutoScrollOptions } from 'sortablejs/plugins'
import ProgramStepForm from './ProgramStepForm.vue'
import { useEditorStore } from '~~/composables/editor'
import type { ProgramStep } from '~/shared/types'

const emit = defineEmits<{
  (event: 'stepMove', from: number, to: number): void
}>()
const editor = useEditorStore()
let dragged: any | null = null

const sortableOptions: SortableOptions & AutoScrollOptions = {
  handle: '.command-drag-handle',
  group: {
    name: 'program-editor',
    pull: false,
    put: true,
  },
}

function onDragStart(event: SortableEvent) {
  editor.selectedStep = -1
  if (isDef(event.oldIndex)) {
    dragged = editor.program?.steps[event.oldIndex] || null
  }
}

function onDragEnd(event: SortableEvent) {
  if (isDef(event.newIndex) && isDef(event.oldIndex) && dragged) {
    emit('stepMove', event.oldIndex, event.newIndex)
    dragged = null
  }
}
</script>

<template>
  <Sortable
    class="program-editor e-div-y"
    :list="// eslint-disable-next-line vue/no-extra-parens
      (editor.program?.steps as ProgramStep[])"
    item-key="stepId"
    :options="sortableOptions"
    @start="onDragStart"
    @end="onDragEnd"
  >
    <template #item="{ index }: { index: number, element: any }">
      <QItem
        dense
        class="program-step"
        :class="{ __selected: editor.selectedStep === index }"
      >
        <QItemSection side class="w-4 pr-4">
          <QItemLabel>
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>
        <QItemSection class="pl-2">
          <div @click="editor.changeSelection(index)">
            <ProgramStepForm :path="`steps.${index}`" />
          </div>
        </QItemSection>

        <QItemSection side class="relative flex items-center">
          <QIcon
            class="icon absolute top-2 cursor-pointer"
            name="close"
            @click="editor.deleteStep(index)"
          />
          <QIcon
            v-if="editor.isDragging"
            class="icon command-drag-handle mt-7 cursor-move"
            name="drag_handle"
          />
        </QItemSection>
      </QItem>
    </template>
  </Sortable>
</template>

<style lang="postcss" scoped>
.program-step {
  @apply hover:(bg-gray-1 dark:bg-dark-1);
  @apply transition-none;
}

.program-step.__selected {
  @apply bg-gray-1 dark:bg-dark-3;
}

.icon {
  @apply text:(white opacity-60);
  @apply dark:(text-white opacity-60);
}
</style>
