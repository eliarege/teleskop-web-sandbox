<script setup lang="ts">
import type { QSelect } from 'quasar'
import { isDef } from '@teleskop/utils'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { useProgramWriteSettings } from '~/composables/settings'
import { CommandEligibility } from '~/shared/constants'

const props = defineProps<{ path: string, stepId: number }>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { $commandManager } = useNuxtApp()
const selectRef = ref<QSelect>()

const { mt } = useProjectTranslations()
const settings = useProgramWriteSettings()

const programCommand = ref<ProgramStepCommand>(editor.getPathElement(props.path))
const isMainCommand = computed(() => props.path.split('.')[2] === 'mainCommand')
const lastStep = computed(() => editor.program.steps[editor.program.steps.length - 1])
const isLastStep = computed(() => props.stepId === lastStep.value.stepId)
const step = computed(() => editor.program.steps.find(s => s.stepId === props.stepId)!)
const id = computed(() => `${step.value.stepId}-${programCommand.value.commandId}`)

const availableCommands = computed(() => {
  const allCommands: MachineCommand[] = Array.from(editor.machine.commands.values())

  return allCommands
    .filter(({ commandType }) => !(isMainCommand.value && commandType === CommandEligibility.PARALLEL_ONLY))
    .filter(({ commandNo }) =>
      commandNo === programCommand.value.commandNo
      || (step.value.mainCommand.commandNo !== commandNo
      && !step.value.parallelCommands.some(cmd => cmd.commandNo === commandNo)),
    )
    .filter(({ commandNo }) =>
      !settings.value.preventParallelUsageForDisabledCommands
      || !isParallelCommandRestricted(commandNo),
    )
    .map(command => ({
      label: `${command.commandNo} ${mt(command.name, editor.machine.id)}`,
      value: command.commandNo,
      icon: editor.getCommandIcon(command.commandNo),
    }))
})

const rules = [
  (value: number) => (isDef(value) || t('emptyCommand')),
  (value: number) => {
    const machineCommand = editor.machine.commands.get(value)
    return machineCommand ? true : t('error.machineCommandNotFound', { commandNo: value })
  },
]

// Komut doğrulama fonksiyonu
function validateCommand() {
  nextTick(() => {
    const commandNo = programCommand.value?.commandNo
    if (isDef(commandNo)) {
      editor.errorIds.delete(id.value)
    } else {
      editor.errorIds.add(id.value)
    }
    selectRef.value?.validate()
  })
}

watch(() => programCommand.value.commandNo, validateCommand)
watch(() => step.value.mainCommand.commandNo, validateCommand)

onMounted(() => {
  if (!isDef(programCommand.value.commandNo) || (isMainCommand.value && !isDef(step.value.mainCommand.commandNo))) {
    editor.errorIds.add(id.value)
  } else if (!editor.machine.commands.has(programCommand.value.commandNo)) {
    editor.errorIds.add(id.value)
  }
  selectRef.value?.focus()
  selectRef.value?.validate()
})

onUnmounted(() => {
  if (step.value)
    editor.errorIds.delete(id.value)
})

async function updateStepCommand(commandNo: number) {
  const command = editor.machine.commands.get(commandNo)
  if (!command)
    return

  const isNewCommand = !isDef(programCommand.value.commandNo)
  editor.updateStepCommandFromDefinition(command, programCommand.value)

  if (!isMainCommand.value && !isLastStep.value && isNewCommand) {
    if (settings.value.confirmAddParallelCommandToSteps)
      $commandManager.executeCommand('moveParallelStep', { $q }, 'add', commandNo)
  }
}

function getCommandLabel(option: any) {
  if (option.label)
    return option.label
  const command = editor.machine.commands.get(option)
  return command ? `${command.commandNo} ${mt(command.name, editor.machine.id)}` : `${option} ${t('error.commandNotFound')}`
}

function isParallelCommandRestricted(commandNo: number): boolean {
  if (!isMainCommand.value) {
    const mainCommandNo = step.value.mainCommand.commandNo
    return editor.machine.commands.get(mainCommandNo)?.dontUseList?.includes(commandNo) || false
  }
  return false
}
</script>

<template>
  <div>
    <QSelect
      ref="selectRef"
      :model-value="programCommand.commandNo"
      :options="availableCommands"
      :label="isDef(programCommand.commandNo) ? undefined : t('selectCommand')"
      :rules="rules"
      :for="id"
      :option-label="getCommandLabel"
      :class="isParallelCommandRestricted(programCommand.commandNo) ? 'opacity-70 ' : ''"
      option-value="value"
      hide-bottom-space
      emit-value
      style="width: 250px"
      class="text-3 command-selector"
      options-dense
      dense
      auto-close
      outlined
      filled
      disable-down-open-menu
      @update:model-value="updateStepCommand"
    >
      <QTooltip v-if="isParallelCommandRestricted(programCommand.commandNo)">
        {{ t('cannotParallelCommand', {
          mainCommandNo: step.mainCommand.commandNo,
          parallelCommandNo: programCommand.commandNo,
        }) }}
      </QTooltip>
    </QSelect>
  </div>
</template>
