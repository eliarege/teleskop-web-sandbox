<script lang="ts" setup>
import { format } from 'date-fns'
import type { QTableColumn } from 'quasar'
import type { BatchCommand, MachineCommand } from '~/types/archive'
import type { DuoAny } from '~/types/utils'

const props = defineProps<{
  commands: DuoAny<BatchCommand>[]
  machineCommands: MachineCommand[]
  selectedTime: Date
}>()
const emit = defineEmits<{
  (e: 'updateSelectedTime', startTime: string): void
}>()
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
    />
  </div>
</template>

<style scoped>
.q-table__card {
  background-color: transparent;
}

.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px;
}
</style>
