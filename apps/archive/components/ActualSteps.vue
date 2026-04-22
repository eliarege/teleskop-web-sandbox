<script lang="ts" setup>
import { format } from 'date-fns'
import type { QTableColumn } from 'quasar'
import StepDetailsDialog from './StepDetailsDialog.vue'
import type { BatchCommand, MachineCommand, Program } from '~/types/archive'
import type { DuoAny } from '~/types/utils'

const props = defineProps<{
  batchKey: number
  commands: DuoAny<BatchCommand>[]
  machineCommands: MachineCommand[]
  theoreticalPrograms: Program[]
  selectedTime: Date
}>()

const emit = defineEmits<{
  (e: 'updateSelectedTime', startTime: string): void
}>()

const $q = useQuasar()
const { t } = useI18n()

const filteredCommands = computed(() => {
  if (!Array.isArray(props.commands))
    return []

  return props.commands.filter((program) => {
    const startTimeValue = new Date(program.startTime).getTime()
    const endTimeValue = new Date(program.endTime).getTime()
    const selectedTimeValue = props.selectedTime.getTime()

    return selectedTimeValue >= startTimeValue && selectedTimeValue <= endTimeValue
      || (selectedTimeValue >= startTimeValue && endTimeValue === 0)
  })
})

const commandsWithNames = computed(() => {
  return filteredCommands.value
    .flatMap(program => [
      {
        ...program,
        commandName: props.machineCommands.find(command => command.commandNo === program.commandNo)?.name || '-',
      },
    ])
    .sort((a, b) => a.stepNo !== b.stepNo ? b.stepNo - a.stepNo : a.parallelStepNo - b.parallelStepNo)
})

const cols = computed(() => [
  { name: 'stepNo', label: t('stepNoShort'), field: 'stepNo', align: 'left', format: val => val + 1 },
  { name: 'commandName', label: t('command'), field: 'commandName', align: 'left', format(val, row) {
    return `(${row.commandNo}) ${val}`
  } },
  { name: 'startTime', label: t('startT'), field: 'startTime', align: 'left', format: v => v ? format(v, 'HH:mm:ss') : '' },
  { name: 'endTime', label: t('endT'), field: 'endTime', align: 'left', format: v => v ? format(v, 'HH:mm:ss') : '' },
] as QTableColumn[])
function handleRowClick(row: any) {
  emit('updateSelectedTime', row.startTime)
}

async function handleDoubleClick(row: BatchCommand) {
  try {
    const actualSteps = await $fetch(`/api/batch/${props.batchKey}/step-details-at-time`, {
      query: {
        time: new Date(row.startTime).toISOString(),
      },
    })

    const programStep = props.theoreticalPrograms
      .flatMap(p => p.steps)
      .find(s => s.mainCommand.commandNo === row.commandNo)

    const mapResultCommandToProgramStepCommand = (cmd: any) => ({
      commandNo: cmd.commandNo,
      parameters: cmd.parameters.map((p: any) => ({ index: p.index, value: p.actualValue })),
      ioList: cmd.ioList.map((io: any) => ({ ioId: 0, ioIndex: io.index, value: io.actualSelections })),
    })

    const actualProgramStep = {
      mainCommand: mapResultCommandToProgramStepCommand(actualSteps.mainCommand),
      parallelCommands: actualSteps.parallelCommands.map(mapResultCommandToProgramStepCommand),
    }

    $q.dialog({
      component: StepDetailsDialog,
      componentProps: {
        machineCommands: props.machineCommands,
        theoreticalProgramStep: programStep,
        actualProgramStep,
        stepIndex: row.stepNo,
      },
    })
  } catch (error: any) {
    console.error('Error fetching step details:', error)
    $q.notify({
      type: 'negative',
      message: error?.data?.message || t('stepDetailsDialog.fetchError'),
    })
  }
}
</script>

<template>
  <div class="p-1 wh-full bg-white">
    <q-table
      :rows="commandsWithNames"
      :columns="cols"
      dense
      hide-bottom
      bordered
      flat
      class="custom-table h-full"
      table-header-style="position: sticky; top: 0; z-index: 1;"
      table-header-class="bg-gray-1 dark:bg-dark-4"
      :pagination="{ rowsPerPage: 0 }"
      @row-click="(e, r) => handleRowClick(r)"
      @row-dblclick="(e, r) => handleDoubleClick(r)"
    />
  </div>
</template>
