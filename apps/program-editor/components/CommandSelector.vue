<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { CommandType } from '~/shared/constants'

const props = defineProps<{
  path: string
}>()

const { t } = useI18n()
const editor = useEditorStore()
const programCommand = ref<ProgramStepCommand>(editor.getPathElement(props.path))
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? CommandType.MAIN : CommandType.PARALLEL

const id = useId()
const select = ref<QSelect>()

watch(() => select.value?.modelValue, () => {
  if (programCommand.value.commandNo === null) {
    editor.errorIds.add(id)
    select.value?.focus()
  } else {
    editor.errorIds.delete(id)
  }
})

onUnmounted(() => {
  editor.errorIds.delete(id)
})

const rules = [
  (value: any) => !!value,
]

const stepIndex = computed(() => Number(props.path.split('.')[1]))
const filteredCommands = computed(() => {
  const commandsArray: MachineCommand[] = Array.from(editor.machine.commands.values())

  let filteredArray = commandsArray.filter(({ commandType }) => {
    // Ana komut türündeyken paralel komutları filtrele
    return !(isMainCommand === CommandType.MAIN && commandType === CommandType.PARALLEL)
  })

  filteredArray = filteredArray.filter(({ commandNo }) => {
    const step = editor.program.steps[stepIndex.value]

    // Ana komutun "dontUseList" kontrolü
    if (isMainCommand === CommandType.PARALLEL) {
      const mainCommand = step.mainCommand
      const machineMainCommand = editor.machine.commands.get(mainCommand.commandNo)

      // dontUseList'te bulunanları filtrele
      if (machineMainCommand?.dontUseList.includes(commandNo)) {
        return false
      }
    }

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
  }))
})

const label = computed(() => {
  return !programCommand.value.commandNo ? t('selectCommand') : undefined
})
</script>

<template>
  <div>
    <QSelect
      ref="select"
      :model-value="programCommand.commandNo"
      :options="filteredCommands"
      :label="label"
      :rules="rules"
      :for="id"
      option-label="label"
      option-value="value"
      map-options
      hide-bottom-space
      emit-value
      style="width: 250px"
      class="text-3"
      options-dense
      dense
      auto-close
      outlined
      filled
    >
      <template #option="scope">
        <QItem
          v-close-popup
          clickable
          dense
          @click="editor.updateCommand(scope.opt.value, programCommand)"
        >
          <QItemSection class="text-3">
            {{ scope.opt.label }}
          </QItemSection>
        </QItem>
      </template>
      <template #no-option>
        <QItem>
          <QItemSection>
            {{ t('selectCommand') }}
          </QItemSection>
        </QItem>
      </template>
    </QSelect>
  </div>
</template>
