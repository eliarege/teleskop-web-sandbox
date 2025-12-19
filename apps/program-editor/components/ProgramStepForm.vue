<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import type { ProgramStep } from '~/shared/types'
import { useErrorStore } from '~/composables/utils'

const props = defineProps<{
  path: string
}>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const errorStore = useErrorStore()
const { $commandManager } = useNuxtApp()

const step: ProgramStep = editor.getPathElement(props.path)
const stepIndex = computed(() => editor.getStepIndex(step.stepId))
const stepIcons = computed(() => {
  const mainIcon = editor.getCommandIcon(step.mainCommand.commandNo)
  const parallelIcons = step.parallelCommands.map(({ commandNo }) => editor.getCommandIcon(commandNo))

  return [mainIcon, ...parallelIcons].filter(icon => isDef(icon))
})

const isLastStep = computed(() => editor.program.steps.length - 1 === stepIndex.value)

const expanded = ref<boolean>(
  errorStore.getStepErrors(editor.machine.id, editor.program.programNo, step.stepId).length > 0
  || editor.allStepExpanded,
)
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

function deleteParallelStep(stepIndex: number, index: number): void {
  editor.selectedSteps = [editor.program.steps[stepIndex]]
  const settings = useProgramWriteSettings()
  if (!isLastStep.value && settings.value.removeParallelCommandFromOtherSteps) {
    const parallelStep = editor.program.steps[stepIndex].parallelCommands[index]
    $commandManager.executeCommand('moveParallelStep', { $q }, 'remove', parallelStep.commandNo)
  }
  editor.deleteParallelStep(stepIndex, index)
}

function getCommandError(commandId: number) {
  return errorStore.getCommandErrors(editor.program.programNo, step.stepId, commandId)[0]
}

function removeError(commandId: number) {
  errorStore.clearCommandErrors(editor.program.programNo, step.stepId, commandId)
  editor.errorIds.delete(`${step.stepId}-${commandId}`)
}
</script>

<template>
  <div class="flex flex-nowrap">
    <div class="flex items-center min-w-6 mr-2">
      <div v-show="!expanded" class="space-y-1">
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
      v-if="!editor.isTonello"
      class="expand-btn mr-2"
      :icon="expandIcon"
      flat
      dense
      tabindex="-1"
      @click="expanded = !expanded"
    />

    <div @click="removeError(step.mainCommand.commandId)">
      <ProgramStepCommandForm
        class="flex-1"
        :path="`${props.path}.mainCommand`"
        :step-id="step.stepId"
        :expanded
        :command-error="getCommandError(step.mainCommand.commandId)"
      />
    </div>
  </div>
  <div v-if="!editor.isTonello">
    <div
      v-show="expanded"
      class="e-border-color border-(t x-0) pl-16"
    >
      <Sortable
        class="parallel-commands"
        item-key="commandId"
        :list="step.parallelCommands"
        :options="sortableOptions"
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
            @click="removeError(step.parallelCommands[index].commandId)"
          >
            <div>
              <ProgramStepCommandForm
                :path="`${props.path}.parallelCommands.${index}`"
                :step-id="step.stepId"
                :expanded
                :command-error="getCommandError(step.parallelCommands[index].commandId)"
              />
            </div>
            <QSpace />
            <QIcon
              class="icon cursor-pointer delete-btn"
              name="close"
              @click.stop="deleteParallelStep(stepIndex, index)"
            />
          </div>
        </template>
      </Sortable>
    </div>
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
