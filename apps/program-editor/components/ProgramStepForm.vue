<script lang="ts" setup>
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
    <div v-show="expanded" class="e-border-color border-(y x-0) mt-2px mb-2 pl-12">
      <div class="parallel-commands">
        <div
          v-for="(command, index) in step.parallelCommands"
          :key="command.commandId"
          class="step-parallel-command"
          :class="{ __selected: editor.selectedStep === stepIndex && editor.selectedParallelStep === index }"
          @click="editor.changeSelection(stepIndex, index)"
        >
          <span class="!text-(white opacity-20)">{{ step.parallelCommands[index].commandId }}</span>
          <div class="program-step-command">
            <ProgramStepCommandForm :path="`${props.path}.parallelCommands.${index}`" />
          </div>
          <QSpace />
          <QBtn
            v-if="editor.selectedStep === stepIndex && editor.selectedParallelStep === index"
            class="!dark:(text-(white opacity-60)) ml-2"
            icon="close"
            flat
            dense
            @click="editor.deleteParallelStep(stepIndex, index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.parallel-commands .program-step-command:not(:last-of-type) {
  @apply border-b border-black border-opacity-20;
  @apply dark:(border-b border-white border-opacity-20);
}

.step-parallel-command.__selected {
  @apply bg-gray-3 dark:bg-dark-1;
}

.step-parallel-command {
  @apply flex w-full hover:(bg-gray-3 dark:bg-dark-1)
}

.expand-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60))
}
</style>
