<script setup lang="ts">
import type { QSelect } from 'quasar'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'
import { useEditorStore } from '~~/composables/editor'
import { CommandType } from '~/shared/constants'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)
const isMainCommand = props.path.split('.')[2] === 'mainCommand' ? CommandType.MAIN : CommandType.PARALLEL

const select = ref<QSelect>()
const id = useId()

const { t } = useI18n()

watch(() => select.value?.modelValue, () => {
  if (programCommand.commandNo === null) {
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

  return commandsArray
    .filter(({ commandType }) =>
      (isMainCommand === CommandType.MAIN && commandType === CommandType.MAIN)
      || (isMainCommand === CommandType.PARALLEL && commandType === CommandType.MAIN)
      || (isMainCommand === CommandType.PARALLEL && commandType === CommandType.PARALLEL),
    )
    .filter(({ commandNo }) => {
      const step = editor.program.steps[stepIndex.value]

      if (isMainCommand === CommandType.MAIN) {
        return step.mainCommand.commandNo
      }
      if (isMainCommand === CommandType.PARALLEL) {
        return commandNo === programCommand.commandNo
          || !step.parallelCommands.some((command: ProgramStepCommand) => command.commandNo === commandNo)
      }

      return true
    })

    .map((command: MachineCommand) => ({
      label: `${command.commandNo} ${command.name}`,
      value: command.commandNo,
    }))
})

const label = computed(() => {
  return !programCommand.commandNo ? t('selectCommand') : undefined
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
      map-options
      hide-bottom-space
      emit-value
      style="width: 250px"
      options-dense
      outlined
      dense
      auto-close
      @update:model-value="editor.updateCommand(programCommand, $event)"
    >
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
