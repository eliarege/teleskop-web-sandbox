<script setup lang="ts">
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import autoTable from 'jspdf-autotable'
import { type QTableColumn, useDialogPluginComponent } from 'quasar'
import RobotoBold from '@teleskop/nuxt-base/assets/fonts/Roboto-Bold.ttf?base64'
import RobotoRegular from '@teleskop/nuxt-base/assets/fonts/Roboto-Regular.ttf?base64'
import type { BatchIntervention } from '~/types/archive'

const props = defineProps<({
  jobOrderNo: string
  startTime: Date | null
  endTime: Date | null
  cancelTime: Date | null
  interventions: BatchIntervention[]
})>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const filter = ref('')

const rows = computed(() => (props.interventions ?? []).map(item => toRaw(item)))

const columns: QTableColumn[] = [
  {
    name: 'time',
    align: 'left',
    label: t('date'),
    field: 'time',
    sortable: true,
    format: (val: Date) => format(val, 'dd/MM/yyyy HH:mm:ss'),
  },
  {
    name: 'operator',
    align: 'left',
    label: t('operator'),
    field: 'operator',
    sortable: true,
  },
  {
    name: 'explanation',
    align: 'left',
    label: t('description'),
    field: 'explanation',
    format: (val: string[]) => val.join(' | '),
  },
]

function createDocument(): jsPDF {
  const doc = new jsPDF()
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto', 'normal')

  return doc
}

function printTable() {
  const doc = createDocument()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const jobOrderNo = props.jobOrderNo ?? '-'
  const startTime = props.startTime ? format(props.startTime, 'dd/MM/yyyy HH:mm:ss') : '-'
  const endTime = props.endTime ? format(props.endTime, 'dd/MM/yyyy HH:mm:ss') : '-'
  const cancelTime = props.cancelTime ? format(props.cancelTime, 'dd/MM/yyyy HH:mm:ss') : '-'

  // HEADER
  doc.setFontSize(14)
  doc.setFont('Roboto', 'bold')
  doc.text(t('interventionReport.title'), pageWidth / 2, 15, { align: 'center' })

  // INFO TABLE
  doc.setFontSize(9)
  doc.setFont('Roboto', 'normal')

  let y = 25

  const infoData = [
    [t('interventionReport.jobOrderNo'), jobOrderNo],
    [t('interventionReport.startTime'), startTime],
    [t('interventionReport.endTime'), endTime],
    [t('interventionReport.cancelTime'), cancelTime],
  ]

  infoData.forEach(([label, value]) => {
    doc.setFont('Roboto', 'bold')
    doc.text(label, 15, y)
    doc.setFont('Roboto', 'normal')
    doc.text(String(value), 45, y)
    y += 5
  })

  // MAIN TABLE
  const tableRows = (props.interventions ?? []).map((int) => {
    const timeFormatted = format(new Date(int.time), 'dd/MM/yyyy HH:mm:ss')
    const explanation = Array.isArray(int.explanation)
      ? int.explanation.join(' | ')
      : int.explanation ?? '-'
    const operator = int.operator ?? '-'

    return [timeFormatted, operator, explanation]
  })

  autoTable(doc, {
    startY: y,
    head: [[t('interventionReport.interventionTime'), t('operator'), t('description')]],
    body: tableRows,
    styles: {
      fontSize: 7,
      font: 'Roboto',
    },
    headStyles: {
      fontSize: 9,
      font: 'Roboto',
      fillColor: [230, 230, 230],
      textColor: 20,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [245, 248, 255],
    },
    margin: { left: 15, right: 15 },
    theme: 'grid',
  })

  // FOOTER
  const pageCount = doc.getNumberOfPages()
  const printDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss')

  doc.setFontSize(9)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Alt çizgi
    doc.setDrawColor(220)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)

    // Basım tarihi (sol)
    doc.text(printDate, 15, pageHeight - 8)

    // Sayfa numarası (sağ)
    doc.text(
      t('interventionReport.page', { n: i }),
      pageWidth - 15,
      pageHeight - 8,
      { align: 'right' },
    )
  }

  doc.save(`${t('interventionReport.fileName')}_${jobOrderNo}.pdf`)
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-250" style="max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('interventions') }}
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

      <q-card-section class="q-pt-none">
        <div class="flex justify-between">
          <q-input
            v-model="filter"
            :placeholder="t('search')"
            class="w-80"
            clearable
            outlined
            dense
          />
          <q-btn
            :label="t('topbar.graph.print')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            icon="print"
            flat
            @click="printTable"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          :columns
          :rows
          :filter="filter"
          :pagination="{ rowsPerPage: 0 }"
          class="h-120"
          table-header-class="bg-gray-1 dark:bg-dark-4"
          table-header-style="position: sticky; top: 0; z-index: 1; height: 40px;"
          dense
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
