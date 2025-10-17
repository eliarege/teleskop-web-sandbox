<script lang="ts" setup>
import { isDef } from '@teleskop/utils'
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
  if (!isDef(programCommand.commandNo))
    return { editableParameters: [], selectableIOs: [] }
  const command = editor.machine?.commands.get(programCommand.commandNo)
  const editableParameters = command?.parameters.filter((parameter: CommandParameter) => parameter.editable || parameter.useFormula) || []
  const selectableIOs = command?.ioList.filter((io: CommandIO) => io.selectable) || []
  return { editableParameters, selectableIOs }
})

const commandIcon = computed(() => editor.getCommandIcon(programCommand.commandNo!))

/**
 * Parametreleri `BFCOMMANDPARAMETERS.PARAMETERGROUP` alanına göre grupla.
 *
 * - PARAMETERGROUP null → tek başına gösterilecek (tekil grup).
 * - PARAMETERGROUP numara → aynı gruptakiler yan yana dizilecek.
 */
const groupedParameters = computed(() => {
  return machineCommand.value.editableParameters.reduce((groups, param, idx) => {
    const groupName = param.group == null ? `single-${idx}` : String(param.group)
    if (!groups[groupName])
      groups[groupName] = []
    groups[groupName].push({ param, originalIndex: idx })
    return groups
  }, {} as Record<string, { param: CommandParameter, originalIndex: number }[]>)
})
</script>

<template>
  <div class="pl-1 pt-1">
    <div class="flex">
      <!-- Command Icon -->
      <div v-show="expanded" class="flex-center mr-2">
        <div class="w-4">
          <div v-if="commandIcon">
            <UnoIcon
              class="icon"
              :class="commandIcon.name"
              :style="{ color: commandIcon.color }"
            />
            <q-tooltip>
              {{ t(`commandType.${commandIcon.label}`) }}
            </q-tooltip>
          </div>
        </div>
      </div>

      <div>
        <!-- Error Messages -->
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
        <!-- Command -->
        <div class="flex">
          <div class="pb-1 pr-2">
            <CommandSelector :path="props.path" />
          </div>

          <!-- Parameters & IOs -->
          <div class="flex-1 flex">
            <div
              v-for="(group, groupName) in groupedParameters"
              :key="`group-${programCommand.commandNo}-${groupName}`"
              class="inline-flex parameter-group mr-2 mb-1 rounded"
              :class="{ 'parameter-group__multiple': group.length > 1 }"
            >
              <ProgramStepCommandParameterInput
                v-for="item in group"
                :key="`pr-${programCommand.commandNo}-${item.originalIndex}`"
                :path="`${props.path}.parameters.${item.originalIndex}`"
                :parameter="item.param"
                :command-no="programCommand.commandNo!"
                class="parameter-input"
                :parameter-error="props.commandError?.messages.find(m => m.parameterIndex === item.param.index)"
              />
            </div>
            <ProgramStepCommandIoInput
              v-for="(io, index) in machineCommand.selectableIOs"
              :key="`io-${programCommand.commandNo}-${index}`"
              :path="`${props.path}.ioList.${index}`"
              :io="io"
              :command-no="programCommand.commandNo!"
              :io-error="props.commandError?.messages.find(m => m.ioIndex === io.index)"
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

<style lang="postcss">
.parameter-group__multiple {
  .parameter-input {
    &:not(:last-child) {
      .q-field--outlined {
        .q-field__control {
          &::before,
          &::after {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
          }
        }
      }
    }

    &:not(:first-child) {
      .q-field--outlined {
        .q-field__control {
          &::before,
          &::after {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
      }
    }
  }
}
</style>
