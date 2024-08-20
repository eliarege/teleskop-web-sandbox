<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import type { ProgramStep } from '~/shared/types'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const devMode = import.meta.dev
const { t } = useI18n()
const step: ProgramStep = editor.getPathElement(props.path)
const stepIndex = computed(() => Number(props.path.split('.').pop()))
const stepIcons = computed(() => [
  editor.getStepIcon(step.mainCommand.commandNo!),
  ...step.parallelCommands.map(({ commandNo }) => editor.getStepIcon(commandNo!)),
])
const expanded = ref(false)
const expandIcon = computed(() => expanded.value ? 'expand_less' : 'expand_more')
const mainIcon = computed(() => editor.getStepIcon(step.mainCommand.commandNo!))
const parallelIcons = computed(() => step.parallelCommands.map(({ commandNo }) => editor.getStepIcon(commandNo!)))

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

// Step Duration
// const index = computed(() => Number(props.path.split('.').pop()))
// const duration = computed(() => formatDuration(
//   calculateProgramStepDuration(editor.program, editor.machine, index.value),
// ))
</script>

<template>
  <div>
    <div class="flex">
      <!-- <span v-if="devMode" class="color-gray-5">{{ step.stepId }}</span> -->
      <!-- <span>{{ duration }}</span> -->

      <div class="flex items-center">
        <div v-show="!expanded">
          <div v-for="(icon, index) in stepIcons" :key="index">
            <span v-if="icon">
              <Icon
                :name="icon.icon"
                class="icon"
                :color="icon.color"
              />
              <q-tooltip>
                {{ icon.label }}
              </q-tooltip>
            </span>
          </div>
        </div>
      </div>

      <QBtn
        class="expand-btn"
        :icon="expandIcon"
        flat
        dense
        @click="toggle"
      />

      <div v-show="expanded" class="mt-3 ml-1">
        <span v-if="mainIcon">
          <Icon
            :name="mainIcon.icon"
            class="icon"
            :color="mainIcon.color"
          />
          <q-tooltip>
            {{ mainIcon.label }}
          </q-tooltip>
        </span>
      </div>

      <ProgramStepCommandForm
        class="flex-1"
        :path="`${props.path}.mainCommand`"
      />
    </div>
    <div v-show="expanded" class="e-border-color border-(y x-0) mt-2px mb-2 pl-16">
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
            class="py-10 inline-block e-text-dim"
          >{{ t('noParallelStep') }}</span>
        </template>
        <template #item="{ index }">
          <div
            class="step-parallel-command"
            :class="{ __selected: editor.selectedStep === stepIndex && editor.selectedParallelStep === index }"
            @click="editor.changeSelection(stepIndex, index)"
          >
            <div class="w-6 mt-3">
              <div v-if="parallelIcons[index]">
                <Icon
                  :name="parallelIcons[index]?.icon"
                  class="icon"
                  :color="parallelIcons[index]?.color"
                />
                <q-tooltip>
                  {{ parallelIcons[index]?.label }}
                </q-tooltip>
              </div>
            </div>

            <div class="program-step-command ">
              <ProgramStepCommandForm :path="`${props.path}.parallelCommands.${index}`" :expanded />
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

.step-parallel-command {
  @apply flex w-full pl-4;
  @apply hover:( dark:bg-dark-1);
}

.step-parallel-command:hover {
  background-color: #d1e4fa;
}

.step-parallel-command.__selected {
  @apply bg-blue-2 dark:bg-dark-1;
}

.expand-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
}

.delete-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
}

.icon {
  @apply text-18px mr-4px cursor-pointer;
}
</style>
