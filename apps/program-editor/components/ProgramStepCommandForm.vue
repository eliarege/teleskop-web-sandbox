<script lang="ts" setup>
import CommandSelector from './CommandSelector.vue'
import ProgramStepCommandParameterInput from './ProgramStepCommandParameterInput.vue'
import ProgramStepCommandIoInput from './ProgramStepCommandIoInput.vue'
import type { CommandIO, CommandParameter, ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const devMode = import.meta.dev
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)

const machineCommand = computed(() => {
  if (!programCommand.commandNo)
    return {}
  const command = editor.machine?.commands.get(programCommand.commandNo)
  const editableParameters = command?.parameters.filter((parameter: CommandParameter) => parameter.editable || parameter.useFormula) || []
  const selectableIOs = command?.ioList.filter((io: CommandIO) => io.selectable) || []
  return { editableParameters, selectableIOs }
})
</script>

<template>
  <div class="pl-1 py-1 flex">
    <!-- <span v-if="devMode" class="color-gray-5">{{ programCommand.commandId }}</span> -->
    <div>
      <div class="pb-2">
        <CommandSelector :path="props.path" />
      </div>
      <div class="flex flex-wrap gap-x-2 gap-y-1">
        <ProgramStepCommandParameterInput
          v-for="(parameter, index) in machineCommand.editableParameters"
          :key="`pr-${programCommand.commandNo}-${index}`"
          :path="`${props.path}.parameters.${index}`"
          :parameter="parameter"
          :command-no="programCommand.commandNo"
        />
        <ProgramStepCommandIoInput
          v-for="(io, index) in machineCommand.selectableIOs"
          :key="`io-${programCommand.commandNo}-${index}`"
          :path="`${props.path}.ioList.${index}`"
          :io="io"
        />
      </div>
    </div>
  </div>
</template>
