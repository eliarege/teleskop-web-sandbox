<script setup lang="ts">
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const props = defineProps({
  vis: Boolean,
})
const emit = defineEmits(['update:vis'])

const { t } = useI18n()

const machines = ref([] as { name: string, value: number, label: string }[])
const selectedMachines = ref([] as number[])
machines.value = await $fetch('/api/machine?asList=true')

function closeDialog() {
  emit('update:vis', false)
}
const fields = ref([
  { label: t('exportExcelDialog.commandList'), value: 1 },
  { label: t('exportExcelDialog.detailedCommandList'), value: 2 },
  { label: t('exportExcelDialog.machineConstansList'), value: 3 },
  { label: t('exportExcelDialog.startParametersList'), value: 4 },
])
const selectedFields = ref([1, 2, 3, 4] as number[])

async function excelFormatter(workbook: ExcelJS.Workbook) {
  let sheet: ExcelJS.Worksheet
  for (const field of selectedFields.value) {
    if (field === 1) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.commandList'))
      sheet.columns = [
        { key: 'machineName', width: 15 },
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
        { key: 'machineName', width: 15 },
        { key: 'commandName', width: 50 },
      ]
      sheet.addRow({
        machineName: t('exportExcelDialog.machine'),
        commandName: t('exportExcelDialog.commandName'),
      }).font = { bold: true }
    }
    if (field === 4) {
      sheet = workbook.addWorksheet(t('exportExcelDialog.startParametersList'))
      sheet.columns = [
        { key: 'machineName', width: 15 },
        { key: 'commandNo', width: 10 },
        { key: 'commandName', width: 50 },
        { key: 'value', width: 10 },
        { key: 'min', width: 10 },
        { key: 'max', width: 10 },
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

    for (const machine of selectedMachines.value) {
      const machineObject = machines.value.find(mach => mach.value === machine)
      if (field === 1) {
        const commands = await $fetch(`/api/machine/${machine}/commands?asList=true`)
        commands.forEach((command) => {
          sheet.addRow({
            machineName: machineObject?.label,
            commandNo: command.value,
            commandName: command.name,
          })
        })
      }
      if (field === 2) {
        const commands = await $fetch(`/api/machine/${machine}/commands`)

        commands.forEach((command) => {
          sheet.addRow({
            machineName: machineObject?.name,
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
        })
      }
      if (field === 3) {
        console.log(3)
      }
      if (field === 4) {
        const parameters = await $fetch(`/api/machine/${machine}/parameters`)

        parameters.forEach((param) => {
          sheet.addRow({
            machineName: machineObject?.label,
            commandNo: param?.id,
            commandName: param?.name,
            value: param?.value < 0 ? t('exportExcelDialog.required') : param?.value,
            min: param?.min,
            max: param?.max,
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

function downloadExcelFile(fileName, buffer) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, fileName)
}
</script>

<template>
  <q-dialog :model-value="vis" persistent>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('exportExcelDialog._') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
          @click="closeDialog"
        />
      </q-card-section>
      <q-card-section>
        <div>
          {{ t('exportExcelDialog.machineList') }}
          <OptionGroupFunctionalityButtons
            :model="selectedMachines"
            :options="machines"
            @update:model="e => selectedMachines = e"
          />
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group
            v-model="selectedMachines"
            dense
            class="p-5"
            :options="machines"
            type="checkbox"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <div>
          {{ t('exportExcelDialog.fields') }}
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group
            v-model="selectedFields"
            dense
            class="p-5"
            :options="fields"
            type="checkbox"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <q-btn
          :label="t('exportExcelDialog.submit')"
          :disable="!(selectedFields.length && selectedMachines.length)"
          @click="exportExcel"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
