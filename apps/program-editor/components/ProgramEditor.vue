<script setup lang="ts">
import ProgramStepForm from './ProgramStepForm.vue'
import { useEditorStore } from '~~/composables/editor'

const editor = useEditorStore()
</script>

<template>
  <div class="program-editor e-div-y pb-100">
    <div
      v-for="(step, index) in editor.program?.steps"
      :key="step.stepId"
      @click="editor.changeSelection(index)"
    >
      <QItem
        dense
        class="program-step"
        :class="{ __selected: editor.selectedStep === index }"
      >
        <span class="!text-(white opacity-20)">{{ editor.program?.steps[index].stepId }}</span>
        <QItemSection side class="w-4 pr-4">
          <QItemLabel>
            {{ index + 1 }}
          </QItemLabel>
        </QItemSection>
        <QItemSection class="pl-2">
          <ProgramStepForm :path="`steps.${index}`" />
        </QItemSection>
        <div class="absolute top-3 right-3">
          <QItemSection side>
            <QBtn
              class="btn-delete"
              icon="close"
              flat
              dense
              @click="editor.deleteStep(index)"
            />
          </QItemSection>
          <QItemSection
            v-if="editor.isDragging"
            side
            class="command-drag-handle"
          >
            <QIcon name="drag_handle" />
          </QItemSection>
        </div>
      </QItem>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.program-step {
  @apply relative;
  @apply hover:(bg-gray-1 dark:bg-dark-1);
  @apply transition-none;
  @apply pl-2;
}

.program-step.__selected {
  @apply bg-gray-1 dark:bg-dark-3;
}

.btn-delete {
  @apply text:(white opacity-60);
  @apply dark:(text-white opacity-60);
  @apply ml-2;
}
</style>
