<script setup lang="ts">
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { MachineCommand, MachineConstant, MachineOption } from '~/shared/types'

const props = defineProps<{
  machineName: string
}>()

const { t } = useI18n()
const editor = useEditorStore()
const { mt } = useProjectTranslations()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const machineOption = ref<MachineOption>('current')
const selectedMachines = computed(() =>
  machineOption.value === 'current' ? [editor.machine] : editor.selectedMachines,
)

const fields = [
  { label: t('exportExcelDialog.commandList'), value: 1 },
  { label: t('exportExcelDialog.detailedCommandList'), value: 2 },
  { label: t('exportExcelDialog.machineConstantsList'), value: 3 },
  { label: t('exportExcelDialog.startParametersList'), value: 4 },
]
const selectedFields = ref<number[]>([1, 2, 3, 4])

async function excelFormatter(workbook: ExcelJS.Workbook) {
  const commands: MachineCommand[] = []

  for (const machine of selectedMachines.value) {
    const machineData = await editor.fetchMachine(machine.id)
    commands.push(...machineData.commands.values())
  }

  for (const field of selectedFields.value) {
    let sheet: ExcelJS.Worksheet | null = null

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
    } else if (field === 2) {
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
    } else if (field === 3) {
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
    } else if (field === 4) {
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

    if (!sheet)
      continue

    for (const machine of selectedMachines.value) {
      if (field === 1) {
        commands.forEach((command) => {
          sheet.addRow({
            machineName: machine?.name,
            commandNo: command.commandNo,
            commandName: mt(command.name, machine.id),
          })
        })
      } else if (field === 2) {
        for (const command of commands) {
          sheet.addRow({
            machineName: machine?.name,
            commandName: mt(command.name, machine.id),
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
      } else if (field === 3) {
        const { constants: machineConstants } = await editor.fetchMachine(machine.id)

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
      } else if (field === 4) {
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
  const fileName = machineOption.value === 'current'
    ? `${editor.machine.name}_${t('exportExcelDialog.report')}`
    : `${t('exportExcelDialog.report')}`
  downloadExcelFile(fileName, buffer)
  onDialogCancel()
}

function downloadExcelFile(fileName: string, buffer: ExcelJS.Buffer) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, fileName)
}
</script>

<template>
  <q-dialog ref="dialogRef" class="select-none">
    <q-card class="min-w-100">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('exportExcelDialog._') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section>
        <CMMachineSelector
          v-model="machineOption"
          :machine-name="props.machineName"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="m-2">
          <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
            {{ t('exportExcelDialog.fieldsToExport') }}
          </label>
          <div>
            <q-option-group
              v-model="selectedFields"
              :options="fields"
              type="checkbox"
              dense
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('cancel')"
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('ok')"
          class="bg-primary text-white"
          flat
          :disable="!(selectedFields.length && selectedMachines.length)"
          @click="exportExcel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
