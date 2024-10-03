<script setup lang="ts">
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand, ParameterItem } from '~/shared/types'
import type { CommandParameterDiff, ProgramStepCommandDiff } from '~/utils/types'
import { ParameterType } from '~/shared/constants'

const props = defineProps<{
  resultSide: ProgramStepCommandDiff | null
  index: number
}>()
const resultSide: ProgramStepCommandDiff = props.resultSide || {} as ProgramStepCommandDiff
const editor = useEditorStore()

function getCommandInfo(commandNo: number | null): MachineCommand {
  if (commandNo) {
    return editor.machine.commands.get(commandNo)!
  }
  return {} as MachineCommand
}

function getParameterName(commandNo: number, paramIndex: number): string {
  const command = getCommandInfo(commandNo)
  return command.parameters[paramIndex]?.name || ''
}

function getParameterValue(param: CommandParameterDiff, commandNo: number | null): string {
  if (commandNo === null) {
    return String(param.value)
  }

  const machineCommand = editor.machine.commands.get(commandNo)
  const machineParameter = machineCommand?.parameters.find(p => param.index === p.index)

  if (!machineParameter) {
    return String(param.value)
  }

  switch (machineParameter.type) {
    case ParameterType.NUMBER:

      return machineParameter.format === 'DURATION'
        ? formatDuration(Number(param.value))
        : String(param.value)
    case ParameterType.SELECT:

      return machineParameter.selections.find(sel => sel.value === param.value)?.name || 'Sel Yok'
    case ParameterType.MACHINE_FORMULA:

      return String(param.value)
    case ParameterType.SELECTABLE_FORMULA:

      return String(param.value)
    default:
      return String(param.value)
  }
}
</script>

<template>
  <div :id="`command-${index}`" class="flex">
    <q-card class="w-full">
      <q-card-section v-if="resultSide !== null">
        <!-- Main Command -->
        <div
          class="main-command"
          :class="{
            'all-red ': resultSide?.mainCommand?.diff,
            'bg-white-100': !resultSide?.mainCommand?.diff,
          }"
        >
          <div
            v-if="resultSide?.mainCommand"
            class="text-h6"
            :class="{ 'text-red  ': resultSide?.mainCommand?.diff }"
          >
            {{ resultSide?.mainCommand?.commandNo }} - {{ getCommandInfo(resultSide?.mainCommand?.commandNo).name }}
          </div>
        </div>

        <!-- Parameters -->
        <q-separator v-if="resultSide?.mainCommand?.parameters?.length > 0" class="separator-thick" />
        <div v-if="resultSide?.mainCommand?.parameters?.length > 0" class="parameters q-py-xs">
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
        <q-separator v-if="resultSide.parallelCommands?.length > 0" class="separator-thick" />
        <div class="q-py-xs" :class="{ 'parallel-commands': resultSide.parallelCommands?.length > 0, 'bg-white': !resultSide.parallelCommands?.length }">
          <q-chip
            v-for="(parallel, idx) in resultSide.parallelCommands"
            :key="idx"
            :color="resultSide.mainCommand.diff || parallel.diff ? 'red fw-bold' : 'secondary fw-bold'"
            text-color="white"
            class="q-ma-xs "
          >
            {{ parallel.commandNo }} - {{ getCommandInfo(parallel.commandNo).name }}
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
