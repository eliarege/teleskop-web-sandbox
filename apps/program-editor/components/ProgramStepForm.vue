<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import { useErrorStore } from '~/composables/utils'

const props = defineProps<{
  stepId: number
}>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const machine = useMachineStore()
const errorStore = useErrorStore()
const { $commandManager } = useNuxtApp()

const step = editor.getPathElement({ stepId: props.stepId })
const stepIndex = computed(() => editor.getStepIndex(step.stepId))
const stepIcons = computed(() => {
  const mainIcon = getCommandIcon(machine.currentMachine.commands, machine.currentMachine.commandTypes, step.mainCommand.commandNo)
  const parallelIcons = step.parallelCommands.map(({ commandNo }) => getCommandIcon(machine.currentMachine.commands, machine.currentMachine.commandTypes, commandNo))

  return [mainIcon, ...parallelIcons].filter(icon => isDef(icon))
})

const isLastStep = computed(() => editor.program.steps.length - 1 === stepIndex.value)

// Initialize step.expanded if undefined
if (step.expanded === undefined) {
  step.expanded = errorStore.getStepErrors(machine.currentMachine.id, editor.program.programNo, step.stepId).length > 0
}

const expandIcon = computed(() => step.expanded ? 'expand_less' : 'expand_more')

const sortableOptions: SortableOptions = {
  sort: false,
  handle: '.__no-handle__',
  group: {
    name: 'parallel-command',
    pull: false,
    put: ['machine-command-list'],
  },
}

function deleteParallelStep(stepIndex: number, index: number): void {
  editor.selectedSteps = [editor.program.steps[stepIndex]]
  const settings = useProgramWriteSettings()
  if (!isLastStep.value && settings.value.removeParallelCommandFromOtherSteps) {
    const parallelStep = editor.program.steps[stepIndex].parallelCommands[index]
    $commandManager.executeCommand('applyParallelCommand', { $q }, 'remove', parallelStep.commandNo, stepIndex)
  }
  editor.deleteParallelStep(stepIndex, index)
}

function getCommandError(commandId: number) {
  return errorStore.getCommandErrors(machine.currentMachine.id, editor.program.programNo, step.stepId, commandId)[0]
}

function removeError(commandId: number) {
  errorStore.clearCommandErrors(machine.currentMachine.id, editor.program.programNo, step.stepId, commandId)
  editor.errorIds.delete(`${step.stepId}-${commandId}`)
}

function handleContextMenu(stepId: number, commandId: number) {
  if (!editor.isStepSelected(stepId, commandId)) {
    editor.selectStep(false, stepId, commandId)
  }
}
</script>

<template>
  <div class="flex flex-nowrap">
    <div class="flex items-center min-w-6 mr-2">
      <div v-show="!step.expanded" class="space-y-1">
        <div
          v-for="(icon, key) in stepIcons"
          :key="key"
        >
          <UnoIcon
            class="icon"
            :class="icon.name"
            :style="{ color: icon.color }"
          />
          <q-tooltip>
            {{ t(`commandType.${icon.label}`) }}
          </q-tooltip>
        </div>
      </div>
    </div>

    <QBtn
      v-if="!machine.isTonello"
      class="expand-btn mr-2"
      :icon="expandIcon"
      flat
      dense
      tabindex="-1"
      @click="step.expanded = !step.expanded"
    >
      <q-tooltip>
        {{ `${step.expanded ? t('collapse') : t('expand')} (Ctrl+E)` }}
      </q-tooltip>
    </QBtn>

    <div @click="removeError(step.mainCommand.commandId)">
      <ProgramStepCommandForm
        class="flex-1"
        :step-id="step.stepId"
        :parallel-index="-1"
        :expanded="step.expanded"
        :command-error="getCommandError(step.mainCommand.commandId)"
      />
    </div>
  </div>
  <div v-if="!machine.isTonello">
    <div
      v-show="step.expanded"
      class="e-border-color border-(t x-0) pl-16"
    >
      <Sortable
        class="parallel-commands e-div-y"
        :list="step.parallelCommands"
        item-key="commandId"
        :options="sortableOptions"
        :data-index="stepIndex"
      >
        <template #header>
          <span
            v-if="step.parallelCommands.length === 0"
            class="py-10 inline-block e-text-dim"
          >
            {{ t('noParallelStep') }}
          </span>
        </template>

        <template #item="{ index, element: command }">
          <QItem
            dense
            clickable
            class="step-parallel-command"
            :active="editor.isStepSelected(step.stepId, command.commandId)"
            active-class="__selected"
            @click.stop="{
              removeError(command.commandId);
              editor.selectStep(false, step.stepId, command.commandId)
            }"
            @contextmenu="handleContextMenu(step.stepId, command.commandId)"
          >
            <QItemSection>
              <ProgramStepCommandForm
                :step-id="step.stepId"
                :parallel-index="index"
                :expanded="step.expanded"
                :command-error="getCommandError(command.commandId)"
              />
            </QItemSection>

            <QItemSection side>
              <QIcon
                class="icon cursor-pointer delete-btn"
                name="close"
                @click.stop="deleteParallelStep(stepIndex, index)"
              />
            </QItemSection>
          </QItem>
        </template>
      </Sortable>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.step-parallel-command {
  @apply select-none;
}

.step-parallel-command.__selected {
  @apply bg-blue-2 text-black;
  @apply dark:(bg-dark-2 text-white);
}

.step-parallel-command:hover .delete-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
}

.delete-btn {
  @apply !text-(black opacity-0) !dark:(text-(white opacity-0));
}

.expand-btn {
  @apply text-gray-4;
}

.error {
  @apply bg-red-2;
}

/* Parallel commands drop area */
.parallel-commands {
  @apply min-h-10;
}

/*
.command-drag-handle {
  @apply opacity-60;
}

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
} */
</style>
