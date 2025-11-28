<script setup lang="ts">
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { enGB, tr } from 'date-fns/locale'

const props = defineProps<{
  machineName: string
}>()

const editor = useEditorStore()
const { t, locale } = useI18n()
const { notifyError } = useNotify()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const machineOption = ref<string>('1')

const selectedMachines = computed(() =>
  machineOption.value === '1' ? [editor.machine] : editor.selectedMachines,
)

const isDisabled = computed(() =>
  machineOption.value === '2' && editor.selectedMachines.length === 0,
)

function getProcessTypeName(typeValue: number) {
  return editor.allProcessTypes.find(pt => pt.value === typeValue)?.label || ''
}

function formatDate(date: string | Date) {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', {
    locale: locale.value === 'tr' ? tr : enGB,
  })
}

async function generatePDF() {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()
  let startY = 10

  for (const machine of selectedMachines.value) {
    const programs = await editor.fetchAllPrograms(machine.id)
    if (!programs.length)
      continue

    doc.setFontSize(12)
    doc.text(`${t('printProgramListDialog.machineNo')}`, 14, startY + 8)
    doc.text(`: ${machine.id}`, 40, startY + 8)
    doc.text(`${t('printProgramListDialog.machineName')}`, 80, startY + 8)
    doc.text(`: ${machine.name}`, 115, startY + 8)

    autoTable(doc, {
      startY: startY + 12,
      head: [[
        t('printProgramListDialog.programNo'),
        t('printProgramListDialog.programName'),
        t('printProgramListDialog.duration'),
        t('printProgramListDialog.stepCount'),
        t('printProgramListDialog.type'),
        t('printProgramListDialog.updatedAt'),
      ]],
      body: programs.map(p => [
        p.programNo,
        p.name,
        formatDuration(p.duration),
        p.stepCount,
        getProcessTypeName(p.type),
        formatDate(p.updatedAt),
      ]),
      margin: { top: 15, right: 14, bottom: 20, left: 14 },
    })

    startY = (doc as any).lastAutoTable.finalY + 15

    if (startY > 250 && machine !== selectedMachines.value[selectedMachines.value.length - 1]) {
      doc.addPage()
      startY = 15
    }
  }

  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${t('printProgramListDialog.page')} ${i} / ${pageCount}`, 105, 287, { align: 'center' })
  }

  return doc
}

async function printProgramList() {
  try {
    const doc = await generatePDF()
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    onDialogCancel()
  } catch (error) {
    notifyError(t('printProgramListDialog.printError'))
  }
}

async function downloadProgramList() {
  try {
    const doc = await generatePDF()
    const fileName = machineOption.value === '1'
      ? `${editor.machine.name}_${t('printProgramListDialog.programList')}.pdf`
      : `${t('printProgramListDialog.programList')}.pdf`
    doc.save(fileName)
    onDialogCancel()
  } catch (error) {
    notifyError(t('printProgramListDialog.downloadError'))
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogCancel"
  >
    <q-card class="w-120 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('printProgramListDialog.title') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <CMMachineSelector
          v-model="machineOption"
          :machine-name="props.machineName"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <q-btn
          :label="t('close')"
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('download')"
          :disable="isDisabled"
          class="bg-primary text-white"
          flat
          @click="downloadProgramList()"
        />
        <q-btn
          :label="t('print')"
          :disable="isDisabled"
          class="bg-primary text-white"
          flat
          @click="printProgramList()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
