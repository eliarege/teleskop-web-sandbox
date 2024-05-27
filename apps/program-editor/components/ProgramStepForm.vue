<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import type { ProgramStep } from '~/shared/types'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const step: ProgramStep = editor.getPathElement(props.path)
const stepIndex = computed(() => Number(props.path.split('.').pop()))

const expanded = ref(false)
const expandIcon = computed(() => expanded.value ? 'expand_less' : 'expand_more')

function toggle() {
  if (editor.selectedStep === stepIndex.value)
    editor.changeSelection(stepIndex.value)
  expanded.value = !expanded.value
}

const sortableOptions: SortableOptions = {

  sort: false,
  handle: '.__no-handle__',
  group: {
    name: 'parallel-command',
    pull: false,
    put: true,
  },
}

// function onDragEnter() {}
// function onDragLeave() {}
</script>

<template>
  <div>
    <div class="flex">
      <QBtn
        class="expand-btn"
        :icon="expandIcon"
        flat
        dense
        @click="toggle"
      />
      <ProgramStepCommandForm
        class="flex-1"
        :path="`${props.path}.mainCommand`"
      />
    </div>
    <div v-show="expanded" class="e-border-color border-(y x-0) mt-2px mb-2 pl-12 ">
      <Sortable
        :list="step.parallelCommands"
        item-key="commandId"
        :options="sortableOptions"
        class="parallel-commands"
        :data-index="stepIndex"
      >
        <template #header>
          <span
            v-if="step.parallelCommands.length === 0"
            class="py-3 inline-block e-text-dim"
          >Paralel Adım Yok</span>
        </template>
        <template #item="{ index }: {index: number}">
          <div
            class="step-parallel-command "
            :class="{ __selected: editor.selectedStep === stepIndex && editor.selectedParallelStep === index }"
            @click="editor.changeSelection(stepIndex, index)"
          >
            <div class="program-step-command ">
              <ProgramStepCommandForm :path="`${props.path}.parallelCommands.${index}`" />
            </div>
            <QSpace />
            <QBtn
              v-if="editor.selectedStep === stepIndex && editor.selectedParallelStep === index"
              class="delete-btn"
              icon="close"
              flat
              dense
              @click="editor.deleteParallelStep(stepIndex, index)"
            />
          </div>
        </template>
      </Sortable>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.parallel-commands .program-step-command:not(:last-of-type) {
  @apply border-b border-black border-opacity-20;
  @apply dark:(border-b border-white border-opacity-20);

}

.step-parallel-command.__selected {
  @apply bg-gray-2 dark:bg-dark-1;
}

.step-parallel-command {
  @apply flex w-full hover:(bg-gray-2 dark:bg-dark-1)
}

.expand-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60))
}

.delete-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60))
}
</style>
