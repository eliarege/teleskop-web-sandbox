<script lang="ts" setup>
import CommandSelector from './CommandSelector.vue'
import ProgramStepCommandParameterInput from './ProgramStepCommandParameterInput.vue'
import ProgramStepCommandIoInput from './ProgramStepCommandIoInput.vue'
import type { CommandIO, CommandParameters, MachineCommand, ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)

const machineCommand = computed(() => {
  const command = editor.machineCommands.get(programCommand.commandNo)
  const editableParameters = command?.parameters.filter(parameter => parameter.editable) || []
  const selectableIOs = command?.ioList.filter(io => io.selectable) || []
  return { editableParameters, selectableIOs }
})
</script>

<template>
  <div class="pl-1 py-1">
    <CommandSelector :path="props.path" />
    <div class="flex flex-wrap gap-x-2 gap-y-1">
      <ProgramStepCommandParameterInput
        v-for="(parameter, index) in machineCommand.editableParameters"
        :key="`pr-${programCommand.commandNo}-${index}`"
        :path="`${props.path}.parameters.${index}`"
        :parameter="parameter"
      />
      <ProgramStepCommandIoInput
        v-for="(io, index) in machineCommand.selectableIOs"
        :key="`io-${programCommand.commandNo}-${index}`"
        :path="`${props.path}.ioList.${index}`"
        :io="io"
      />
    </div>
  </div>
</template>
