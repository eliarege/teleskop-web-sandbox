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

const getStepError = (stepId: number) => editor.programErrors?.find(err => err.stepId === stepId)

function handleRemoveError(stepId: number, commandId: number) {
  const id = `${stepId}-${commandId}`
  const errors = editor.programErrors || []
  const stepErrorIndex = errors.findIndex(err => err.stepId === stepId)
  if (stepErrorIndex !== -1) {
    const stepError = errors[stepErrorIndex]
    stepError.commands = stepError.commands.filter(
      cmd => cmd.commandId !== commandId,
    )

    // Eğer komut hatası kalmadıysa, stepi de kaldır
    if (stepError.commands.length === 0) {
      errors.splice(stepErrorIndex, 1)
    }

    editor.errorIds.delete(id)
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
    @click="editor.selectedSteps = []"
  >
    <template #item="{ index }: { index: number, element: any }">
      <QItem
        dense
        class="program-step"
        :class="{ __selected: editor.isStepSelected(editor.program.steps[index].stepId) }"
        @click.stop
      >
        <QItemSection side @click.stop="editor.selectStep($event.ctrlKey, index)">
          <QItemLabel class="w-5">
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>
        <QItemSection
          class="pl-2"
          @click.stop="editor.selectStep($event.ctrlKey, index)"
        >
          <div :id="`step-${index}`">
            <ProgramStepForm
              :path="`steps.${index}`"
              :step-error="getStepError(editor.program.steps[index].stepId)"
              @remove-error="handleRemoveError"
            />
          </div>
        </QItemSection>

        <QItemSection side>
          <QIcon
            class="icon absolute top-2 cursor-pointer"
            name="close"
            @click.stop="editor.deleteStep(editor.program.steps[index].stepId)"
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
.program-editor {
  @apply pb-120;
}

.program-step {
  @apply select-none;
  @apply transition-none;
  @apply hover:(bg-gray-1 text-black dark:bg-dark-2 dark:text-white);
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
