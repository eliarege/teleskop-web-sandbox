<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from 'utils'
import type { AutoScrollOptions } from 'sortablejs/plugins'
import ProgramStepForm from './ProgramStepForm.vue'
import { useEditorStore } from '~~/composables/editor'
import type { ProgramStep } from '~/shared/types'

const editor = useEditorStore()
let dragged: ProgramStep | null = null

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
  editor.selectedParallelStep = -1
  if (isDef(event.oldIndex)) {
    dragged = editor.program?.steps[event.oldIndex] || null
  }
}

function onDragEnd(event: SortableEvent) {
  if (isDef(event.newIndex) && isDef(event.oldIndex) && dragged) {
    editor.program.steps.splice(event.oldIndex, 1)
    editor.program.steps.splice(event.newIndex, 0, dragged)
    dragged = null
  }
}
</script>

<template>
  <Sortable
    class="program-editor e-div-y pb-120 "
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
        <QItemSection side>
          <QItemLabel>
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>
        <QItemSection class="pl-2">
          <div :id="`step-${index}`" @click="editor.changeSelection(index)">
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
  @apply transition-none;
  @apply hover:(bg-gray-1 text-black);
  @apply dark:(hover:(bg-dark-4 text-white));
}

.program-step.__selected {
  @apply bg-blue-1 text-black;
  @apply dark:(bg-dark-2 text-white);
}

.icon {
  @apply text:(white opacity-60);
  @apply dark:(text-white opacity-60);
}
</style>
