<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { useProgramWriteSettings } from '~/composables/settings'
import { CommandType } from '~/shared/constants'

const props = defineProps<{
  path: string
}>()

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { $commandManager } = useNuxtApp()

const programCommand = ref<ProgramStepCommand>(editor.getPathElement(props.path))
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? CommandType.MAIN : CommandType.PARALLEL

const select = ref<QSelect>()
const stepIndex = computed(() => Number(props.path.split('.')[1]))
const id = `${editor.program.steps[stepIndex.value].stepId}-${programCommand.value.commandId}`
const isLastStep = stepIndex.value === editor.program.steps.length - 1

const filteredCommands = computed(() => {
  const commandsArray: MachineCommand[] = Array.from(editor.machine.commands.values())

  let filteredArray = commandsArray.filter(({ commandType }) => {
    // Ana komut türündeyken paralel komutları filtrele
    return !(isMainCommand === CommandType.MAIN && commandType === CommandType.PARALLEL)
  })

  filteredArray = filteredArray.filter(({ commandNo }) => {
    const step = editor.program.steps[stepIndex.value]

    // Ana komutun "dontUseList" kontrolü
    // if (isMainCommand === CommandType.PARALLEL) {
    //   const mainCommand = step.mainCommand
    //   const machineMainCommand = editor.machine.commands.get(mainCommand.commandNo)

    //   // dontUseList'te bulunanları filtrele
    //   if (machineMainCommand?.dontUseList.includes(commandNo)) {
    //     return false
    //   }
    // }

    // Aynı komut zaten kullanılmışsa filtrele
    return commandNo === programCommand.value.commandNo
      || (
        step.mainCommand.commandNo !== commandNo
        && !step.parallelCommands.some((command: ProgramStepCommand) => command.commandNo === commandNo)
      )
  })

  return filteredArray.map((command: MachineCommand) => ({
    label: `${command.commandNo} ${command.name}`,
    value: command.commandNo,
    icon: editor.getStepIcon(command.commandNo),
  }))
})

const label = computed(() => {
  return !programCommand.value.commandNo ? t('selectCommand') : undefined
})

const rules = [
  (value: number) => {
    return !!value || t('emptyCommand') // Seçim boşsa hata mesajı
  },
  (value: number) => {
    const step = editor.program.steps[stepIndex.value]
    const machineMainCommand = editor.machine.commands.get(step.mainCommand.commandNo)

    // Ana komutun "dontUseList" kontrolü
    if (isMainCommand === CommandType.PARALLEL) {
      if (machineMainCommand?.dontUseList?.includes(value)) {
        return t('cannotParallelCommand', {
          mainCommandNo: step.mainCommand.commandNo,
          parallelCommandNo: value,
        })
      }
    }

    return true
  },
]

function validateCommand() {
  nextTick(() => {
    const commandNo = programCommand.value?.commandNo
    // const mainCommandNo = editor.program.steps[stepIndex.value]?.mainCommand?.commandNo
    // const machineMainCommand = editor.machine.commands.get(mainCommandNo)

    if (!commandNo) {
      editor.errorIds.add(id)
    } else {
      editor.errorIds.delete(id)
    }

    select.value?.validate()
  })
}

// watch: programCommand.value.commandNo
watch(
  () => programCommand.value.commandNo,
  () => validateCommand(),
)

// watch: mainCommand.commandNo
watch(
  () => editor.program.steps[stepIndex.value]?.mainCommand?.commandNo,
  () => validateCommand(),
)

onMounted(() => {
  const step = editor.program.steps[stepIndex.value]
  const mainCommand = step?.mainCommand
  const commandNo = programCommand.value?.commandNo
  // const machineMainCommand = editor.machine.commands.get(mainCommand?.commandNo)

  select.value?.focus()

  // const isInvalidCommand = !commandNo
  // || (machineMainCommand?.dontUseList.includes(commandNo))

  // Ana adım ve paralel adım için ortak kontrol
  if (
    (isMainCommand === CommandType.MAIN && !commandNo)
    || (isMainCommand === CommandType.PARALLEL && (!mainCommand?.commandNo || !commandNo))
  ) {
    editor.errorIds.add(id)
    return
  }

  editor.errorIds.delete(id)
  select.value?.validate()
})

async function updateStepCommand(commandNo: number, programCommand: ProgramStepCommand) {
  const isNewCommand = !programCommand.commandNo
  editor.updateCommand(commandNo, programCommand)

  if (isMainCommand === CommandType.PARALLEL && !isLastStep && isNewCommand) {
  // Program yazma ayarlarına göre paralel adımları taşı
    const settings = useProgramWriteSettings()
    if (settings.value.confirmAddParallelCommandToSteps)
      $commandManager.executeCommand('moveParallelStep', { $q }, 'add', commandNo, programCommand)
  }
}

onUnmounted(() => {
  editor.errorIds.delete(id)
})

function getCommandName(option: any) {
  if (!option.label) {
    return `${programCommand.value.commandNo} ${editor.machine.commands.get(option)?.name}`
  }
  return option.label
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
      ref="select"
      :model-value="programCommand.commandNo"
      :options="filteredCommands"
      :label="label"
      :rules="rules"
      :for="id"
      :option-label="getCommandName"
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
      @update:model-value="value => updateStepCommand(value, programCommand)"
    />
  </div>
</template>
