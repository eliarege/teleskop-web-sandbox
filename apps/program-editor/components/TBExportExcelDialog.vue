<script setup lang="ts">
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { MachineCommand, MachineConstant, MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps<{
  machineGroups: MachineGroup[]
}>()

const kc = useKeycloak()
const { t } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()
let sheet: ExcelJS.Worksheet

const selectedMachines = ref<string[]>([])
const expanded = ref<string[]>([])
const nodes = computed(() => {
  if (!props.machineGroups)
    return []

  return props.machineGroups.filter(group => group.machines.length > 0).map(group => ({
    id: group.groupId,
    label: group.name,
    selectable: false,
    children: group.machines.map(machine => ({
      id: `${machine.groupId}-${machine.id}`,
      label: machine.name,
      selectable: false,
    })),
  }))
})

const fields = ref([
  { label: t('exportExcelDialog.commandList'), value: 1 },
  { label: t('exportExcelDialog.detailedCommandList'), value: 2 },
  { label: t('exportExcelDialog.machineConstantsList'), value: 3 },
  { label: t('exportExcelDialog.startParametersList'), value: 4 },
])
const selectedFields = ref<number[]>([1, 2, 3, 4])

async function excelFormatter(workbook: ExcelJS.Workbook) {
  const selectedMachineIds = selectedMachines.value.map(machine => Number(machine.split('-')[1]))

  const commands: MachineCommand[] = await kc.fetch(`/api/machine/commands`, {
    method: 'POST',
    body: { machineIds: selectedMachineIds },
  })

  for (const field of selectedFields.value) {
    if (field === 1) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.commandList'))
      sheet.columns = [
        { key: 'machineName', width: 20 },
        { key: 'commandNo', width: 10 },
        { key: 'commandName', width: 50 },
      ]
      sheet.addRow({
        machineName: t('exportExcelDialog.machine'),
        commandNo: t('exportExcelDialog.commandNo'),
        commandName: t('exportExcelDialog.commandName'),
      }).font = { bold: true }
    }
    if (field === 2) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.detailedCommandList'))
      sheet.columns = [
        { key: 'machineName', width: 10 },
        { key: 'commandName', width: 20 },
        { key: '', width: 20 },
        { key: '', width: 10 },
        { key: '', width: 10 },
      ]
      sheet.addRow({
        machineName: t('exportExcelDialog.machine'),
        commandName: t('exportExcelDialog.commandName'),
      }).font = { bold: true }
    }
    if (field === 3) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.machineConstantsList'))
      sheet.columns = [
        { key: 'machineName', width: 10 },
        { key: 'parameterId', width: 10 },
        { key: 'parameterName', width: 20 },
        { key: 'value', width: 10 },
        { key: 'min', width: 7 },
        { key: 'max', width: 7 },
      ]
      sheet.addRow({
        machineName: t('exportExcelDialog.machine'),
        parameterId: t('exportExcelDialog.parameterId'),
        parameterName: t('exportExcelDialog.parameterName'),
        value: t('exportExcelDialog.value'),
        min: t('exportExcelDialog.min'),
        max: t('exportExcelDialog.max'),
      }).font = { bold: true }
    }
    if (field === 4) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.startParametersList'))
      sheet.columns = [
        { key: 'machineName', width: 10 },
        { key: 'commandNo', width: 10 },
        { key: 'commandName', width: 20 },
        { key: 'value', width: 15 },
        { key: 'min', width: 7 },
        { key: 'max', width: 7 },
      ]
      sheet.addRow({
        machineName: t('exportExcelDialog.machine'),
        commandNo: t('exportExcelDialog.commandNo'),
        commandName: t('exportExcelDialog.commandName'),
        value: t('exportExcelDialog.value'),
        min: t('exportExcelDialog.min'),
        max: t('exportExcelDialog.max'),
      }).font = { bold: true }
    }

    for (const machineId of selectedMachineIds) {
      const machine = props.machineGroups.find(group => group.machines.find(machine => machine.id === machineId))

      if (field === 1) {
        commands.forEach((command) => {
          sheet.addRow({
            machineName: machine?.name,
            commandNo: command.commandNo,
            commandName: command.name,
          })
        })
      }
      if (field === 2) {
        for (const command of commands) {
          sheet.addRow({
            machineName: machine?.name,
            commandName: command.name,
          })

          if (command.parameters.find(param => param.editable === true)) {
            sheet.addRow([
              ' ',
              t('exportExcelDialog.parameter'),
              t('exportExcelDialog.value'),
              t('exportExcelDialog.min'),
              t('exportExcelDialog.max'),
            ]).font = { bold: true }

            command.parameters.forEach((param) => {
              if (param.editable) {
                sheet.addRow([
                  ' ',
                  param?.name,
                  param?.value ? param?.value : 0,
                  param?.minValue,
                  param?.maxValue,
                ])
              }
            })
          }
          if (command.ioList.find(io => io.selectable === true)) {
            sheet.addRow([
              ' ',
              t('exportExcelDialog.commandIOName'),
              t('exportExcelDialog.IOName'),
              t('exportExcelDialog.default'),
            ]).font = { bold: true }
            command.ioList.forEach((io) => {
              if (io.selectable) {
                io.selections.forEach((selection, index) => {
                  sheet.addRow([
                    ' ',
                    index ? ' ' : io.name,
                    selection.name,
                    selection.defaultValue ? t('yes') : t('no'),
                  ])
                })
              }
            })
          }
          sheet.addRow({})
        }
      }
      if (field === 3) {
        const machineConstants = await kc.fetch(`/api/machine/${machineId}/constants`)

        machineConstants.forEach((constant: MachineConstant) => {
          sheet.addRow({
            machineName: machine?.name,
            parameterId: constant.machineParameterId,
            parameterName: constant.paramString,
            value: constant.currentValue,
            min: constant.paramLowLimit,
            max: constant.paramHighLimit,
          })
        })
      }
      if (field === 4) {
        commands.forEach((command) => {
          command.parameters.forEach((param) => {
            sheet.addRow({
              machineName: machine?.name,
              commandNo: command?.commandNo,
              commandName: command?.name,
              value: Number(param?.value) < 0 ? t('exportExcelDialog.required') : param?.value,
              min: param?.minValue,
              max: param?.maxValue,
            })
          })
        })
      }
    }
  }
}
async function exportExcel() {
  const workbook = new ExcelJS.Workbook()

  await excelFormatter(workbook)

  const buffer = await workbook.xlsx.writeBuffer()
  downloadExcelFile('Program Editor Report', buffer)
}

function downloadExcelFile(fileName: string, buffer: ExcelJS.Buffer) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, fileName)
}
</script>

<template>
  <QDialog ref="dialogRef" class="select-none">
    <QCard class="min-w-100">
      <QCardSection class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('exportExcelDialog._') }}
        </div>
        <QSpace />
        <QBtn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </QCardSection>
      <QCardSection>
        <div class="flex items-center">
          <span>{{ t('exportExcelDialog.machineList') }}</span>
          <QSpace />
          <OptionGroupFunctionalityButtons
            v-model="selectedMachines"
            :options="machineGroups?.flatMap(mg => mg.machines.map(m => `${m.groupId}-${m.id}`))"
          />
        </div>

        <QTree
          v-model:ticked="selectedMachines"
          v-model:expanded="expanded"
          :nodes="nodes"
          node-key="id"
          tick-strategy="leaf"
          default-expand-all
          dense
          class="w-full min-h-120 max-h-120 overflow-y-scroll"
        />
      </QCardSection>
      <QCardSection>
        <div>
          {{ t('exportExcelDialog.fields') }}
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <QOptionGroup
            v-model="selectedFields"
            dense
            class="p-5"
            :options="fields"
            type="checkbox"
          />
        </div>
      </QCardSection>
      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('ok')"
          class="q-mr-sm bg-primary"
          flat
          :disable="!(selectedFields.length && selectedMachines.length)"
          @click="exportExcel"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
