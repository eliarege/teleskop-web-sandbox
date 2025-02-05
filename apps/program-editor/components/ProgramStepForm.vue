<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import type { ProgramStep, StepError } from '~/shared/types'
import { calculateProgramStepDuration } from '~/shared/formula'

const props = defineProps<{
  path: string
  stepError?: StepError
}>()

const emit = defineEmits<{
  (event: 'removeError', stepId: number, commandId: number): void
}>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { $commandManager } = useNuxtApp()

const step: ProgramStep = editor.getPathElement(props.path)
const stepIndex = computed(() => Number(props.path.split('.').pop()))
const isLastStep = stepIndex.value === editor.program.steps.length - 1
const stepIcons = computed(() => {
  const mainIcon = editor.getStepIcon(step.mainCommand.commandNo!)
  const parallelIcons = step.parallelCommands.map(({ commandNo }) => editor.getStepIcon(commandNo!))
  return [mainIcon, ...parallelIcons]
})

const expanded = ref(editor.allStepExpanded)
const expandIcon = computed(() => expanded.value ? 'expand_less' : 'expand_more')

watch(() => editor.allStepExpanded, () => {
  expanded.value = editor.allStepExpanded
})

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
const duration = computed(() => {
  const stepDurations = calculateProgramStepDuration(editor.program, editor.machine, editor.teleskopSettings.initialTemperature, stepIndex.value)
  const totalStepDuration = stepDurations.reduce((total, step) => total + step.duration, 0)
  return formatDuration(totalStepDuration)
})

function deleteParallelStep(stepIndex: number, index: number) {
  editor.selectedSteps = [editor.program.steps[stepIndex]]
  const settings = useProgramWriteSettings()
  if (!isLastStep && settings.value.removeParallelCommandFromOtherSteps) {
    $commandManager.executeCommand('moveParallelStep', { $q }, 'remove', editor.program.steps[stepIndex].parallelCommands[index].commandNo, editor.program.steps[stepIndex].parallelCommands[index])
  }
  editor.deleteParallelStep(stepIndex, index)
}

const getCommandError = (commandId: number) => props.stepError?.commands.find(cmd => cmd.commandId === commandId)
const showStepError = computed(() => {
  return getCommandError(step.mainCommand.commandId)
    || (step.parallelCommands.some(cmd => !!getCommandError(cmd.commandId)) && !expanded.value)
})

function removeError(stepId: number, commandId: number) {
  emit('removeError', stepId, commandId)
}
</script>

<template>
  <div class="flex">
    <div class="flex items-center w-5">
      <div v-show="!expanded" class="space-y-1">
        <div
          v-for="(icon, key) in stepIcons"
          :key="key"
        >
          <div v-if="icon">
            <UnoIcon
              class="icon"
              :class="icon.name"
              :style="{ color: icon.color }"
            />
            <q-tooltip>
              {{ icon.name ? icon.label : t('noIcon') }}
            </q-tooltip>
          </div>
        </div>
      </div>
    </div>

    <DevOnly>
      <div class="flex flex-col color-gray-5 text-3">
        <span>{{ `stepId: ${step.stepId}` }}</span>
        <span>{{ `commandId: ${step.mainCommand.commandId}` }}</span>
        <span>{{ duration }}</span>
      </div>
    </DevOnly>

    <QBtn
      class="expand-btn"
      :icon="expandIcon"
      flat
      dense
      @click="expanded = !expanded"
    />

    <div @click="removeError(stepIndex, step.mainCommand.commandId)">
      <ProgramStepCommandForm
        class="flex-1"
        :class="{ error: showStepError }"
        :path="`${props.path}.mainCommand`"
        :expanded
        :command-error="getCommandError(step.mainCommand.commandId)"
      />
    </div>
  </div>
  <div v-show="expanded" class="e-border-color border-(t x-0) pl-16">
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
          :class="{
            error: getCommandError(step.parallelCommands[index].commandId),
          }"
          @click="removeError(stepIndex, step.parallelCommands[index].commandId)"
        >
          <DevOnly>
            <div class="flex flex-col color-gray-5 text-3">
              <span>{{ `commandId: ${step.parallelCommands[index].commandId}` }}</span>
            </div>
          </DevOnly>

          <div>
            <ProgramStepCommandForm
              :path="`${props.path}.parallelCommands.${index}`"
              :expanded
              :command-error="getCommandError(step.parallelCommands[index].commandId)"
            />
          </div>
          <QSpace />
          <QBtn
            class="delete-btn"
            icon="close"
            flat
            dense
            @click="deleteParallelStep(stepIndex, index)"
          />
        </div>
      </template>
    </Sortable>
  </div>
</template>

<style lang="postcss" scoped>
.step-parallel-command {
  @apply flex flex-row items-center w-full pl-4;
  @apply border-b border-black border-opacity-20;
  @apply dark:(border-b border-white border-opacity-20);
}

.step-parallel-command:last-child {
  @apply border-none;
}

.step-parallel-command:hover {
  .delete-btn {
    @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
  }
}

.step-parallel-command.__selected {
  @apply bg-blue-2 dark:bg-dark-1;
}

.expand-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
}

.delete-btn {
  @apply !text-(black opacity-0) !dark:(text-(white opacity-0));
}

.icon {
  @apply text-18px mr-4px cursor-pointer;
}

.error {
  @apply bg-red-2;
}
</style>
