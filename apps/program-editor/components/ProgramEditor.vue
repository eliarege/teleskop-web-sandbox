<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
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
  editor.selectedSteps = []
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

const ctrl = useKeyModifier('Control')

function selectStep(stepIndex: number) {
  const editor = useEditorStore()
  const stepId = editor.program.steps[stepIndex].stepId
  const hasSelectedStep = editor.selectedSteps.find(step => step.stepId === stepId)

  if (ctrl.value && !hasSelectedStep) {
    editor.selectedSteps.push(editor.program.steps.find(step => step.stepId === stepId)!)

    editor.selectedSteps.sort((a, b) => {
      const indexA = editor.program.steps.findIndex(x => x.stepId === a.stepId)
      const indexB = editor.program.steps.findIndex(x => x.stepId === b.stepId)
      return indexA - indexB
    })
  } else if (ctrl.value && hasSelectedStep)
    editor.selectedSteps = editor.selectedSteps.filter(step => step.stepId !== stepId)
  else
    editor.selectedSteps = [editor.program.steps.find(step => step.stepId === stepId)!]
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
        :class="{ __selected: editor.selectedSteps.find(step => step.stepId === editor.program.steps[index].stepId) }"
      >
        <QItemSection side>
          <QItemLabel class="w-5">
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>
        <QItemSection class="pl-2">
          <div :id="`step-${index}`" @click="selectStep(index)">
            <ProgramStepForm :path="`steps.${index}`" />
          </div>
        </QItemSection>

        <QItemSection side>
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
  @apply select-none;
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
