<script lang="ts" setup>
import CommandSelector from './CommandSelector.vue'
import ProgramStepCommandParameterInput from './ProgramStepCommandParameterInput.vue'
import ProgramStepCommandIoInput from './ProgramStepCommandIoInput.vue'
import type { CommandError, CommandIO, CommandParameter, ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  path: string
  expanded?: boolean
  commandError?: CommandError
}>()

const { t } = useI18n()
const editor = useEditorStore()
const programCommand: ProgramStepCommand = editor.getPathElement(props.path)
const machineCommand = computed(() => {
  if (!programCommand.commandNo)
    return { editableParameters: [], selectableIOs: [] }
  const command = editor.machine?.commands.get(programCommand.commandNo)
  const editableParameters = command?.parameters.filter((parameter: CommandParameter) => parameter.editable || parameter.useFormula) || []
  const selectableIOs = command?.ioList.filter((io: CommandIO) => io.selectable) || []
  return { editableParameters, selectableIOs }
})

const commandIcon = computed(() => editor.getStepIcon(programCommand.commandNo!))
</script>

<template>
  <div class="pl-1 pt-1">
    <div class="flex">
      <div v-if="expanded" class="w-7 flex-center">
        <div v-if="commandIcon">
          <UnoIcon
            class="icon"
            :class="commandIcon.name"
            :style="{ color: commandIcon.color }"
          />
          <q-tooltip>
            {{ commandIcon.label }}
          </q-tooltip>
        </div>
      </div>

      <div>
        <span
          v-for="messages in commandError?.messages"
          :key="messages.type"
          class="text-red text-xs text-gray-7 dark:text-gray-4 block pb-1"
        >
          {{
            t(`programError.${messages.type}`, {
              commandNo: programCommand.commandNo,
              paramIndex: messages.parameterIndex,
              paramName: messages.parameterName,
              ioIndex: messages.ioIndex,
              ioName: messages.ioName,
              ioValue: messages.ioValue,
            })
          }}
        </span>

        <div class="flex">
          <div class="pb-1 pr-2">
            <CommandSelector :path="props.path" />
          </div>

          <div>
            <ProgramStepCommandParameterInput
              v-for="(parameter, index) in machineCommand.editableParameters"
              :key="`pr-${programCommand.commandNo}-${index}`"
              :path="`${props.path}.parameters.${index}`"
              :parameter="parameter"
              :command-no="programCommand.commandNo!"
            />
            <ProgramStepCommandIoInput
              v-for="(io, index) in machineCommand.selectableIOs"
              :key="`io-${programCommand.commandNo}-${index}`"
              :path="`${props.path}.ioList.${index}`"
              :io="io"
              :command-no="programCommand.commandNo!"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
  .icon {
  @apply text-18px mr-4px cursor-pointer;
}
</style>
