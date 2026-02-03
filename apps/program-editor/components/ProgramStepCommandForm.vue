<script lang="ts" setup>
import { isDef } from '@teleskop/utils'
import CommandSelector from './CommandSelector.vue'
import ProgramStepCommandParameterInput from './ProgramStepCommandParameterInput.vue'
import ProgramStepCommandIoInput from './ProgramStepCommandIoInput.vue'
import type { CommandError, CommandIO, CommandParameter, ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  stepId: number
  parallelIndex: number // -1 for main command, >= 0 for parallel command
  expanded?: boolean
  commandError?: CommandError
}>()

const { t } = useI18n()
const $q = useQuasar()
const editor = useEditorStore()
const machine = useMachineStore()
const { $commandManager } = useNuxtApp()

const programCommand = editor.getPathElement({ stepId: props.stepId, parallelIndex: props.parallelIndex })
const machineCommand = computed(() => {
  if (!isDef(programCommand.commandNo))
    return { editableParameters: [], selectableIOs: [] }
  const command = machine.currentMachine.commands.get(programCommand.commandNo)
  const editableParameters = command?.parameters.filter((parameter: CommandParameter) => parameter.editable || parameter.useFormula) || []
  const selectableIOs = command?.ioList.filter((io: CommandIO) => io.selectable) || []

  return { editableParameters, selectableIOs }
})

const commandIcon = computed(() => getCommandIcon(machine.currentMachine.commands, machine.currentMachine.commandTypes, programCommand.commandNo!))

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

const isParallelCommand = computed(() => props.parallelIndex >= 0)
const stepIndex = computed(() => editor.program.steps.findIndex(s => s.stepId === props.stepId))
const isLastStep = computed(() => stepIndex.value === editor.program.steps.length - 1)

function handleParameterBlur(parameterIndex: number, oldValue: number | string, _newValue: number | string) {
  const settings = useProgramWriteSettings()

  // Son adım değilse ve sonraki adımlarda bu komut varsa
  const hasNextStep = !isLastStep.value && editor.program.steps
    .slice(stepIndex.value + 1)
    .some(step => step.parallelCommands.some(pc => pc.commandNo === programCommand.commandNo))

  if (!hasNextStep)
    return

  // Ayar aktifse ve komut paralel ise parametreyi sonraki adıma taşı
  if (settings.value.changeParallelCommandParameterInOtherSteps && isParallelCommand.value) {
    const parameter = programCommand.parameters.find(p => p.index === parameterIndex)

    if (!parameter) {
      console.warn(`Parametre bulunamadı: index=${parameterIndex}, commandNo=${programCommand.commandNo}`)
      return
    }

    $commandManager.executeCommand(
      'applyParallelCommand',
      { $q },
      'changeParameter',
      programCommand.commandNo,
      stepIndex.value + 1,
      parameter,
      oldValue,
    )
  }
}
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
            <CommandSelector :step-id="stepId" :parallel-index="parallelIndex" />
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
                :step-id="stepId"
                :parallel-index="parallelIndex"
                :parameter-index="item.originalIndex"
                :parameter="item.param"
                :command-no="programCommand.commandNo!"
                class="parameter-input"
                :parameter-error="props.commandError?.messages.find(m => m.parameterIndex === item.param.index)"
                @parameter-blur="handleParameterBlur"
              />
            </div>
            <ProgramStepCommandIoInput
              v-for="(io, index) in machineCommand.selectableIOs"
              :key="`io-${programCommand.commandNo}-${index}`"
              :step-id="stepId"
              :parallel-index="parallelIndex"
              :io-index="index"
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
