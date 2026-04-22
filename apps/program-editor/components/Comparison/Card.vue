<script setup lang="ts">
import type { CommandParameterDiff, MachineCommand, ProgramStepCommandDiff } from '~/shared/types'
import { ParameterType } from '~/shared/constants'

const props = defineProps<{
  resultSide?: ProgramStepCommandDiff | null
  stepIndex: number
}>()

const machine = useMachineStore()
const { mt } = useProjectTranslations()

function getCommandInfo(commandNo: number): MachineCommand | undefined {
  return machine.currentMachine.commands.get(commandNo)
}

function getParameterName(commandNo: number, paramIndex: number): string {
  const command = getCommandInfo(commandNo)
  const paramName = command?.parameters[paramIndex]?.name
  return paramName ? mt(paramName, machine.currentMachine.id) : String(paramIndex)
}

function getCommandLabel(commandNo: number): string {
  const command = getCommandInfo(commandNo)
  return command ? mt(command.name, machine.currentMachine.id) : String(commandNo)
}

function getParameterValue(param: CommandParameterDiff, commandNo: number): string {
  const machineCommand = machine.currentMachine.commands.get(commandNo)
  const machineParameter = machineCommand?.parameters.find(p => param.index === p.index)
  if (machineParameter) {
    if (machineParameter.type === ParameterType.NUMBER && machineParameter.format === 'DURATION')
      return formatDuration(Number(param.value))
    if (machineParameter.type === ParameterType.SELECT || machineParameter.type === ParameterType.SELECT_ADDITIVE)
      return machineParameter.selections.find(s => s.value === param.value)?.name || String(param.value)
    if (machineParameter.type === ParameterType.CHECKBOX)
      return param.value
  }
  return String(param.value)
}

const isCommandDiff = computed(() => !!props.resultSide?.mainCommand.diff)
const hasParamDiff = computed(() =>
  !isCommandDiff.value && (
    props.resultSide?.mainCommand.parameters.some(p => p.diff)
    || props.resultSide?.parallelCommands.some(c => c.diff || c.parameters.some(p => p.diff))
    || false
  ),
)
</script>

<template>
  <!-- Empty: step exists only on other side -->
  <div
    v-if="!resultSide"
    class="h-full min-h-16 rounded border-2 border-dashed border-red-4/60 dark:border-red-7/40 bg-red-1/30 dark:bg-red-9/10"
  />

  <!-- Step card -->
  <div
    v-else
    class="rounded border border-gray-3 dark:border-dark-1 overflow-hidden"
    :class="[
      isCommandDiff
        ? 'border-l-3 border-l-red-5 dark:border-l-red-6'
        : hasParamDiff
          ? 'border-l-3 border-l-amber-5 dark:border-l-amber-5'
          : 'border-l-3 border-l-transparent',
    ]"
  >
    <!-- Main command -->
    <div
      class="flex items-center gap-2 px-3 py-2"
      :class="isCommandDiff ? 'bg-red-1/50 dark:bg-red-9/15' : 'bg-gray-1 dark:bg-dark-4'"
    >
      <span class="text-gray-4 dark:text-gray-7 shrink-0 w-8 text-right leading-none">
        {{ resultSide.mainCommand.commandNo }}
      </span>
      <span
        class="font-semibold leading-snug truncate"
        :class="isCommandDiff ? 'text-red-6 dark:text-red-4' : 'text-gray-9 dark:text-gray-2'"
      >
        {{ getCommandLabel(resultSide.mainCommand.commandNo) }}
      </span>
    </div>

    <!-- Parameters -->
    <div
      v-if="resultSide.mainCommand.parameters.length > 0"
      class="flex flex-wrap gap-1 px-3 py-1.5 bg-gray-2/40 dark:bg-dark-3/40 border-t border-gray-3/50 dark:border-dark-1/50"
    >
      <span
        v-for="param in resultSide.mainCommand.parameters"
        :key="param.index"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border"
        :class="isCommandDiff || param.diff
          ? 'bg-red-1 dark:bg-red-9/25 text-red-7 dark:text-red-3'
          : 'bg-light-6 dark:bg-dark-2 text-gray-7 dark:text-gray-3'"
      >
        <span class="opacity-60">{{ getParameterName(resultSide.mainCommand.commandNo, param.index) }}</span>
        <span>{{ getParameterValue(param, resultSide.mainCommand.commandNo) }}</span>
      </span>
    </div>

    <!-- Parallel commands -->
    <div
      v-if="resultSide.parallelCommands.length > 0"
      class="px-3 py-1.5 border-t border-gray-3/50 dark:border-dark-1/50 bg-gray-3/20 dark:bg-dark-2/30 space-y-1"
    >
      <div
        v-for="(parallel, idx) in resultSide.parallelCommands"
        :key="idx"
        class="flex flex-wrap items-center gap-1"
      >
        <span
          class="text-xs font-medium shrink-0"
          :class="isCommandDiff || parallel.diff ? 'text-red-6 dark:text-red-4' : 'text-gray-6 dark:text-gray-4'"
        >
          <span class="opacity-60 mr-0.5">{{ parallel.commandNo }}</span>
          {{ getCommandLabel(parallel.commandNo) }}
        </span>
        <span
          v-for="param in parallel.parameters"
          :key="param.index"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border"
          :class="isCommandDiff || parallel.diff || param.diff
            ? 'bg-red-1 dark:bg-red-9/25 text-red-7 dark:text-red-3'
            : 'bg-light-6 dark:bg-dark-2 text-gray-6 dark:text-gray-4'"
        >
          <span class="opacity-60">{{ getParameterName(parallel.commandNo, param.index) }}</span>
          <span>{{ getParameterValue(param, parallel.commandNo) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
