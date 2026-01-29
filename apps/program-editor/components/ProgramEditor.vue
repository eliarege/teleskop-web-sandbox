<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
import type { AutoScrollOptions } from 'sortablejs/plugins'
import ProgramStepForm from './ProgramStepForm.vue'
import { useEditorStore } from '~~/composables/editor'
import type { ProgramStep } from '~/shared/types'

const editor = useEditorStore()
const steps = computed<ProgramStep[]>(() => editor.program?.steps || [])

let dragged: ProgramStep | null = null

const sortableOptions: SortableOptions & AutoScrollOptions = {
  handle: '.command-drag-handle',
  group: {
    name: 'program-editor',
    pull: false,
    put: ['machine-command-list'],
  },
}

function onDragStart(event: SortableEvent) {
  editor.selectedSteps = []
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

function handleContextMenu(stepId: number) {
  if (!editor.isStepSelected(stepId)) {
    editor.selectStep(false, stepId)
  }
}
</script>

<template>
  <Sortable
    class="program-editor e-div-y"
    :list="steps"
    item-key="stepId"
    :options="sortableOptions"
    @start="onDragStart"
    @end="onDragEnd"
  >
    <template #item="{ index, element: step }: { index: number; element: ProgramStep }">
      <QItem
        dense
        clickable
        class="program-step"
        :active="editor.isStepSelected(step.stepId)"
        active-class="__selected"
        @click="editor.selectStep(($event as PointerEvent).ctrlKey, step.stepId)"
        @contextmenu="handleContextMenu(step.stepId)"
      >
        <QItemSection side>
          <QItemLabel class="w-5">
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>

        <QItemSection>
          <div :id="`step-${step.stepId}`">
            <ProgramStepForm :step-id="step.stepId" />
          </div>
        </QItemSection>

        <QItemSection side>
          <QIcon
            class="icon absolute top-2 cursor-pointer"
            name="close"
            @click.stop="editor.deleteStep(step.stepId)"
          />
          <QIcon class="icon command-drag-handle mt-7 cursor-move" name="drag_handle" />
        </QItemSection>
      </QItem>
    </template>
  </Sortable>

  <!--
    Focus Sentinel:
    Focus olduğunda programın sonuna otomatik olarak yeni bir adım ekler.
  -->
  <div
    tabindex="0"
    class="opacity-0 w-0 h-0"
    @focus="editor.addStepToEnd(null)"
  />
</template>

<style lang="postcss" scoped>
.program-editor {
  @apply pb-120;
}

.program-step {
  @apply select-none;
  @apply transition-none;
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
