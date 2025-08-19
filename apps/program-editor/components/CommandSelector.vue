<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { useProgramWriteSettings } from '~/composables/settings'
import { CommandType } from '~/shared/constants'

const props = defineProps<{ path: string }>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { $commandManager } = useNuxtApp()
const selectRef = ref<QSelect>()

const settings = useProgramWriteSettings()

const programCommand = ref<ProgramStepCommand>(editor.getPathElement(props.path))
const stepIndex = computed(() => Number(props.path.split('.')[1]))
const isMainCommand = computed(() => props.path.split('.')[2] === 'mainCommand')
const isLastStep = computed(() => stepIndex.value === editor.program.steps.length - 1)
const stepData = computed(() => editor.program.steps[stepIndex.value])
const id = computed(() => `${stepData.value.stepId}-${programCommand.value.commandId}`)

const availableCommands = computed(() => {
  const allCommands: MachineCommand[] = Array.from(editor.machine.commands.values())

  return allCommands
    .filter(({ commandType }) => !(isMainCommand.value && commandType === CommandType.PARALLEL))
    .filter(({ commandNo }) =>
      commandNo === programCommand.value.commandNo
      || (stepData.value.mainCommand.commandNo !== commandNo
      && !stepData.value.parallelCommands.some(cmd => cmd.commandNo === commandNo)),
    )
    .filter(({ commandNo }) =>
      !settings.value.preventParallelUsageForDisabledCommands
      || !isParallelCommandRestricted(commandNo),
    )
    .map(command => ({
      label: `${command.commandNo} ${command.name}`,
      value: command.commandNo,
      icon: editor.getStepIcon(command.commandNo),
    }))
})

const rules = [
  (value: number) => (!!value || t('emptyCommand')),
  (value: number) => {
    const machineCommand = editor.machine.commands.get(value)
    return machineCommand ? true : t('error.machineCommandNotFound', { commandNo: value })
  },
]

// Komut doğrulama fonksiyonu
function validateCommand() {
  nextTick(() => {
    const commandNo = programCommand.value?.commandNo
    commandNo ? editor.errorIds.delete(id.value) : editor.errorIds.add(id.value)
    selectRef.value?.validate()
  })
}

watch(() => programCommand.value.commandNo, validateCommand)
watch(() => stepData.value.mainCommand.commandNo, validateCommand)

onMounted(() => {
  if (!programCommand.value.commandNo || (isMainCommand.value && !stepData.value.mainCommand.commandNo)) {
    editor.errorIds.add(id.value)
  } else if (!editor.machine.commands.has(programCommand.value.commandNo)) {
    editor.errorIds.add(id.value)
  }
  selectRef.value?.focus()
  selectRef.value?.validate()
})

onUnmounted(() => {
  if (stepData.value)
    editor.errorIds.delete(id.value)
})

async function updateStepCommand(commandNo: number) {
  const isNewCommand = !programCommand.value.commandNo
  editor.updateCommand(commandNo, programCommand.value)

  if (!isMainCommand.value && !isLastStep.value && isNewCommand) {
    if (settings.value.confirmAddParallelCommandToSteps)
      $commandManager.executeCommand('moveParallelStep', { $q }, 'add', commandNo, programCommand.value)
  }
}

function getCommandLabel(option: any) {
  if (option.label)
    return option.label
  const command = editor.machine.commands.get(option)
  return command ? `${command.commandNo} ${command.name}` : `${option} ${t('error.commandNotFound')}`
}

function isParallelCommandRestricted(commandNo: number): boolean {
  if (!isMainCommand.value) {
    const mainCommandNo = stepData.value.mainCommand.commandNo
    return editor.machine.commands.get(mainCommandNo)?.dontUseList?.includes(commandNo) || false
  }
  return false
}
</script>

<template>
  <div>
    <DevOnly>
      <div class="flex flex-col color-gray-5 text-3">
        <span>{{ id }}</span>
      </div>
    </DevOnly>
    <QSelect
      ref="selectRef"
      :model-value="programCommand.commandNo"
      :options="availableCommands"
      :label="programCommand.commandNo ? undefined : t('selectCommand')"
      :rules="rules"
      :for="id"
      :option-label="getCommandLabel"
      :class="isParallelCommandRestricted(programCommand.commandNo) ? 'opacity-70 ' : ''"
      option-value="value"
      hide-bottom-space
      emit-value
      style="width: 250px"
      class="text-3"
      options-dense
      dense
      auto-close
      outlined
      filled
      @update:model-value="updateStepCommand"
    >
      <QTooltip v-if="isParallelCommandRestricted(programCommand.commandNo)">
        {{ t('cannotParallelCommand', {
          mainCommandNo: stepData.mainCommand.commandNo,
          parallelCommandNo: programCommand.commandNo,
        }) }}
      </QTooltip>
    </QSelect>
  </div>
</template>
