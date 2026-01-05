<script setup lang="ts">
import { useEditorStore } from '~/composables/editor'
import type { CommandParameterDiff, MachineCommand, ProgramStepCommandDiff } from '~/shared/types'
import { ParameterType } from '~/shared/constants'

defineProps<{
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
  return paramName ? mt(paramName, machine.currentMachine.id) : ''
}

function getCommandString(commandNo: number): string {
  const command = getCommandInfo(commandNo)
  return command ? `${commandNo} - ${mt(command.name, machine.currentMachine.id)}` : ''
}

function getParameterValue(param: CommandParameterDiff, commandNo: number): string {
  const machineCommand = machine.currentMachine.commands.get(commandNo)
  const machineParameter = machineCommand?.parameters.find(p => param.index === p.index)

  if (machineParameter) {
    if (machineParameter.type === ParameterType.NUMBER && machineParameter.format === 'DURATION') {
      return formatDuration(Number(param.value))
    }
    if (machineParameter.type === ParameterType.SELECT || machineParameter.type === ParameterType.SELECT_ADDITIVE) {
      return machineParameter.selections.find(s => s.value === param.value)?.name || ''
    }
    if (machineParameter.type === ParameterType.CHECKBOX) {
      return param.value
    }
  }
  return String(param.value)
}
</script>

<template>
  <div :id="`command-${stepIndex}`" class="flex">
    <q-card class="w-full">
      <q-card-section v-if="resultSide">
        <!-- Main Command -->
        <div
          class="main-command"
          :class="{
            'all-red ': resultSide.mainCommand.diff,
            'bg-white-100': !resultSide.mainCommand.diff,
          }"
        >
          <div
            v-if="resultSide.mainCommand"
            class="text-h6"
            :class="{ 'text-red  ': resultSide.mainCommand.diff }"
          >
            {{ getCommandString(resultSide.mainCommand.commandNo) }}
          </div>
        </div>

        <!-- Parameters -->
        <q-separator v-if="resultSide.mainCommand.parameters.length > 0" class="separator-thick" />
        <div v-if="resultSide.mainCommand.parameters.length > 0" class="parameters q-py-xs">
          <q-chip
            v-for="param in resultSide.mainCommand.parameters"
            :key="param.index"
            :color="resultSide.mainCommand.diff ? 'red' : (param.diff ? 'red fw-bold' : 'secondary fw-bold')"
            text-color="white"
            class="q-ma-xs fw-bold"
          >
            {{ getParameterName(resultSide.mainCommand.commandNo, param.index) }}:
            {{ getParameterValue(param, resultSide.mainCommand.commandNo) }}
          </q-chip>
        </div>

        <!-- Parallel Commands -->
        <q-separator v-if="resultSide.parallelCommands.length > 0" class="separator-thick" />
        <div class="q-py-xs" :class="resultSide.parallelCommands.length ? 'parallel-commands' : 'bg-white'">
          <q-chip
            v-for="(parallel, idx) in resultSide.parallelCommands"
            :key="idx"
            :color="resultSide.mainCommand.diff || parallel.diff ? 'red fw-bold' : 'secondary fw-bold'"
            text-color="white"
            class="q-ma-xs "
          >
            {{ getCommandString(parallel.commandNo) }}
            <q-badge
              v-for="param in parallel.parameters"
              :key="param.index"
              color="white"
              :text-color="resultSide.mainCommand.diff || parallel.diff || param.diff ? 'red fw-bold' : 'secondary fw-bold'"
              class="q-ml-sm"
            >
              {{ getParameterName(parallel.commandNo, param.index) }}:
              {{ getParameterValue(param, parallel.commandNo) }}
            </q-badge>
          </q-chip>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped lang="postcss">
.section-grid {
  display: grid;
  grid-template-columns: 1fr 7px 1fr;
  gap: 3px;
  justify-items: center;
}

.custom-splitter-horizontal {
  @apply w-1px h-full border-1 border-black;
}

.main-command .text-h6 {
  font-weight: bold;
}

.all-red {
  color: red;
}

.all-red .q-chip {
  background-color: red !important;
  color: white !important;
}

.all-red .q-badge {
  background-color: white !important;
  color: red !important;
}

.text-red {
  color: red;
}

.parallel-commands {
  background-color: lightgray;
}

.separator-thick {
  height: 3px;
  background-color: #a1a0a0;
}

.q-card {
  border: 2px solid #3c3a3a;
}
</style>
