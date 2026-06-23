<script setup lang="ts">
import { formatDuration } from '@teleskop/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const props = defineProps<{
  batchKey: number
}>()

const emit = defineEmits(['close'])

const { t, d } = useI18n()

const STEP_STATUS = {
  FINISHED: 0,
  ADDED_LATER: 1,
  SKIPPED_OR_DELETED: 2,
  PENDING: 3,
} as const

type StepStatus = typeof STEP_STATUS[keyof typeof STEP_STATUS]

type StepWorkingTime = {
  step: number
  program: string
  programName?: string
  command: string
  commandName?: string
  startTime?: string | null
  endTime?: string | null
  theoreticalDuration?: number | null
  actualDuration?: number | null
  stepStatus?: StepStatus | null
}

type StepWorkingTimeRow = Omit<StepWorkingTime, 'startTime' | 'endTime' | 'theoreticalDuration' | 'actualDuration'> & {
  startTime: string
  endTime: string
  theoreticalDuration: string
  actualDuration: string
  rawTheoreticalDuration: number | null
  rawActualDuration: number | null
}

type StepWorkingTimeColumn = {
  name: string
  label: string
  field: keyof StepWorkingTimeRow
  align: 'center'
}

function getRowClassByStatus(step: {
  stepStatus?: StepStatus | null
  actualDuration?: number | null
  theoreticalDuration?: number | null
}) {
  if (isTimeExceeded(step)) {
    return 'bg-red-200'
  }

  switch (step.stepStatus) {
    case STEP_STATUS.FINISHED:
      return 'bg-green-200'
    case STEP_STATUS.ADDED_LATER:
      return 'bg-blue-200'
    case STEP_STATUS.SKIPPED_OR_DELETED:
      return 'bg-yellow-200'
    case STEP_STATUS.PENDING:
    default:
      return 'bg-white'
  }
}

function isTimeExceeded(step: {
  stepStatus?: StepStatus | null
  actualDuration?: number | null
  theoreticalDuration?: number | null
}) {
  return step.stepStatus === STEP_STATUS.FINISHED
    && !!step.actualDuration
    && !!step.theoreticalDuration
    && step.actualDuration > step.theoreticalDuration
}

function getPdfFillColor(step: {
  stepStatus?: StepStatus | null
  actualDuration?: number | null
  theoreticalDuration?: number | null
}) {
  if (isTimeExceeded(step)) {
    return [254, 202, 202]
  }

  switch (step.stepStatus) {
    case STEP_STATUS.FINISHED:
      return [187, 247, 208]
    case STEP_STATUS.ADDED_LATER:
      return [191, 219, 254]
    case STEP_STATUS.SKIPPED_OR_DELETED:
      return [253, 224, 71]
    default:
      return null
  }
}

const { data: stepWorkingTimes } = await useAuthFetch<StepWorkingTime[]>('/api/stepWorkingTimes', {
  query: { batchKey: props.batchKey },
})
const modifiedStepWorkingTimes = computed<StepWorkingTimeRow[]>(() => {
  return (stepWorkingTimes.value || []).map((step) => {
    return {
      ...step,
      step: step.step + 1,
      program: step.programName ? `${step.program} ${step.programName}` : step.program,
      command: step.commandName ? `${step.command} ${step.commandName}` : step.command,
      startTime: step.startTime ? d(new Date(step.startTime), 'datetime') : '',
      endTime: step.endTime ? d(new Date(step.endTime), 'datetime') : '',
      rawTheoreticalDuration: step.theoreticalDuration ?? null,
      rawActualDuration: step.actualDuration ?? null,
      theoreticalDuration: step.theoreticalDuration ? formatDuration(step.theoreticalDuration * 1000) : '',
      actualDuration: step.actualDuration ? formatDuration(step.actualDuration * 1000) : '',
    }
  })
})

const cols = computed<StepWorkingTimeColumn[]>(() => [
  { name: 'step', label: t('stepWorkingTimes.step'), field: 'step', align: 'center' as const },
  { name: 'program', label: t('stepWorkingTimes.program'), field: 'program', align: 'center' as const },
  { name: 'command', label: t('stepWorkingTimes.command'), field: 'command', align: 'center' as const },
  { name: 'startTime', label: t('stepWorkingTimes.startTime'), field: 'startTime', align: 'center' as const },
  { name: 'endTime', label: t('stepWorkingTimes.endTime'), field: 'endTime', align: 'center' as const },
  { name: 'theoreticalDuration', label: t('stepWorkingTimes.theoreticalDuration'), field: 'theoreticalDuration', align: 'center' as const },
  { name: 'actualDuration', label: t('stepWorkingTimes.actualDuration'), field: 'actualDuration', align: 'center' as const },
])

function getRowClass(row: any) {
  return getRowClassByStatus({
    stepStatus: row.stepStatus,
    actualDuration: row.rawActualDuration,
    theoreticalDuration: row.rawTheoreticalDuration,
  })
}

async function printTable() {
  // This was originally Roboto-Bold
  const font = await import('@teleskop/nuxt-base/assets/fonts/Roboto-Bold.ttf?base64')

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  doc.addFileToVFS('Roboto-Bold.ttf', font.default)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'normal')

  doc.setFontSize(16)
  doc.setFont('Roboto', 'bold')
  const title = t('stepWorkingTimes.title')
  doc.text(title, 148, 15, { align: 'center' })

  const headers = cols.value.map(col => col.label)
  const data = (modifiedStepWorkingTimes.value || []).map(row =>
    cols.value.map((col) => {
      const value = row[col.field]
      if (col.field === 'step') {
        return value === 0 ? '0' : (value || '')
      }
      return value || ''
    }),
  )

  const totalTableWidth = 18 + 22 + 22 + 52 + 52 + 38 + 38
  const pageWidth = 297
  const leftMargin = (pageWidth - totalTableWidth) / 2

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 22,
    margin: { left: leftMargin, right: leftMargin },
    theme: 'grid',
    tableWidth: 'auto',
    styles: {
      font: 'Roboto',
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 2.5,
      halign: 'center',
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      font: 'Roboto',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [100, 100, 100],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 52 },
      4: { cellWidth: 52 },
      5: { cellWidth: 38 },
      6: { cellWidth: 38 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const row = (stepWorkingTimes.value || [])[data.row.index]
        const fillColor = getPdfFillColor(row || {})
        if (fillColor) {
          data.cell.styles.fillColor = fillColor
          data.cell.styles.textColor = [0, 0, 0]
        }
      }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY || 22
  doc.setFontSize(11)
  doc.setFont('Roboto', 'bold')
  doc.text(t('stepWorkingTimes.colorCodes'), leftMargin, finalY + 10)

  doc.setFontSize(9)
  doc.setFont('Roboto', 'normal')

  const legendY = finalY + 14
  const boxSize = 5
  const spacing = 8

  doc.setFillColor(191, 219, 254)
  doc.rect(leftMargin, legendY, boxSize, boxSize, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.rect(leftMargin, legendY, boxSize, boxSize, 'S')
  doc.text(t('stepWorkingTimes.addedLater'), leftMargin + 7, legendY + 4)

  doc.setFillColor(253, 224, 71)
  doc.rect(leftMargin, legendY + spacing, boxSize, boxSize, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.rect(leftMargin, legendY + spacing, boxSize, boxSize, 'S')
  doc.text(t('stepWorkingTimes.deletedOrSkipped'), leftMargin + 7, legendY + spacing + 4)

  doc.setFillColor(187, 247, 208)
  doc.rect(leftMargin, legendY + spacing * 2, boxSize, boxSize, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.rect(leftMargin, legendY + spacing * 2, boxSize, boxSize, 'S')
  doc.text(t('stepWorkingTimes.completed'), leftMargin + 7, legendY + spacing * 2 + 4)

  doc.setFillColor(254, 202, 202)
  doc.rect(leftMargin, legendY + spacing * 3, boxSize, boxSize, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.rect(leftMargin, legendY + spacing * 3, boxSize, boxSize, 'S')
  doc.text(t('stepWorkingTimes.timeExceeded'), leftMargin + 7, legendY + spacing * 3 + 4)

  doc.setFillColor(255, 255, 255)
  doc.rect(leftMargin, legendY + spacing * 4, boxSize, boxSize, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.rect(leftMargin, legendY + spacing * 4, boxSize, boxSize, 'S')
  doc.text(t('stepWorkingTimes.pending'), leftMargin + 7, legendY + spacing * 4 + 4)

  doc.autoPrint()
  doc.output('dataurlnewwindow')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="w-full p-5 border border-3 border-gray-600 rounded z-100 bg-white print-container">
    <!-- Header -->
    <div class="mb-4 pb-3 border-b border-gray-300">
      <h2 class="text-xl font-bold text-gray-800">
        {{ t('stepWorkingTimes.title') }}
      </h2>
    </div>

    <div class="overflow-auto max-h-[600px]">
      <q-table
        :rows="modifiedStepWorkingTimes || []"
        :columns="cols"
        row-key="step"
        dense
        bordered
        flat
        :rows-per-page-options="[0]"
        hide-pagination
      >
        <template #body="bodyProps">
          <q-tr
            :props="bodyProps"
            :class="getRowClass(bodyProps.row)"
          >
            <q-td
              v-for="col in cols"
              :key="col.name"
              :props="bodyProps"
            >
              {{ bodyProps.row[col.field] }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <div class="mt-4 flex items-center gap-4 text-sm">
      <div class="font-semibold">
        {{ t('stepWorkingTimes.colorCodes') }}
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-blue-200 border border-gray-400" />
        <label for="overtime">{{ t('stepWorkingTimes.addedLater') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-yellow-200 border border-gray-400" />
        <label for="saved">{{ t('stepWorkingTimes.deletedOrSkipped') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-200 border border-gray-400" />
        <label for="completed">{{ t('stepWorkingTimes.completed') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-red-200 border border-gray-400" />
        <label for="timeExceeded">{{ t('stepWorkingTimes.timeExceeded') }}</label>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-white border border-gray-400" />
        <label for="pending">{{ t('stepWorkingTimes.pending') }}</label>
      </div>
    </div>

    <div class="mt-4 flex justify-end gap-2 no-print">
      <q-btn
        outline
        color="primary"
        icon="print"
        :label="t('stepWorkingTimes.print')"
        @click="printTable"
      />
      <q-btn
        color="primary"
        :label="t('stepWorkingTimes.ok')"
        @click="handleClose"
      />
    </div>
  </div>
</template>

<style lang="postcss">
@media print {
  .no-print {
    display: none !important;
  }

  .print-container {
    border: none !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .overflow-auto {
    overflow: visible !important;
    max-height: none !important;
  }

  .q-table {
    font-size: 11px !important;
    width: 100% !important;
  }

  .q-table th,
  .q-table td {
    padding: 8px 4px !important;
    white-space: nowrap !important;
  }

  .q-table thead th {
    font-size: 12px !important;
    font-weight: bold !important;
  }

  .bg-red-200,
  .bg-yellow-200,
  .bg-green-200,
  .bg-blue-200 {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: landscape;
    margin: 10mm;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .text-xl {
    font-size: 16px !important;
    margin-bottom: 10px !important;
  }

  .text-sm {
    font-size: 10px !important;
    margin-top: 10px !important;
  }
}
</style>
