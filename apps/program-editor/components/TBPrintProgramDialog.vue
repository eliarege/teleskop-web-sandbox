<script setup lang="ts">
import type { MachineCommand, MachineOption, Program, ProgramTableRow } from '~/shared/types'
import CMMachineSelector from '~/components/CMMachineSelector.vue'

const props = defineProps<{
  machineName: string
  programList: ProgramTableRow[]
  commandList: MachineCommand[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const editor = useEditorStore()
const { notifyError } = useNotify()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const machineOption = ref<MachineOption>('current')

const programList = ref<ProgramTableRow[]>(props.programList)
const isLoadingPrograms = ref(false)
const selectedPrograms = ref<ProgramTableRow[]>(props.programList)

const commandList = ref<MachineCommand[]>(props.commandList)
const isLoadingCommands = ref(false)
const selectedCommands = ref<MachineCommand[]>(props.commandList)

const isPrinting = ref(false)
const isDownloading = ref(false)

const selectedMachine = computed(() => {
  if (machineOption.value === 'current') {
    return editor.machine
  } else if (machineOption.value === 'selected' && editor.selectedMachines.length > 0) {
    return editor.selectedMachines[0]
  }
  return null
})

const isDisabled = computed(() =>
  machineOption.value === 'selected' && !editor.selectedMachines.length
  || selectedPrograms.value.length === 0
  || selectedCommands.value.length === 0
  || isPrinting.value
  || isDownloading.value,
)

async function loadData() {
  selectedPrograms.value = []
  selectedCommands.value = []

  await Promise.all([loadProgramList(), loadCommandList()])
}

async function loadProgramList() {
  isLoadingPrograms.value = true
  selectedPrograms.value = []

  try {
    if (selectedMachine.value) {
      programList.value = await editor.fetchAllPrograms(selectedMachine.value.id)
    }
  } finally {
    isLoadingPrograms.value = false
  }
}

async function loadCommandList() {
  isLoadingCommands.value = true
  selectedCommands.value = []

  try {
    if (selectedMachine.value) {
      const machine = await editor.fetchMachine(selectedMachine.value.id)
      commandList.value = Array.from(machine.commands.values())
    }
  } finally {
    isLoadingCommands.value = false
  }
}

async function getPrograms(machineId: number, programNos: number[]): Promise<Program[]> {
  isLoadingPrograms.value = true
  const programs = ref<Program[]>([])

  try {
    for (const programNo of programNos) {
      const program = await editor.fetchProgram(machineId, programNo)
      programs.value.push(program)
    }

    return programs.value
  } finally {
    isLoadingPrograms.value = false
  }
}

watch([machineOption, () => editor.selectedMachines], loadData)

const programColumns = computed(() => [
  { name: 'programNo', label: t('printProgramListDialog.programNo'), field: 'programNo', align: 'left' as const, sortable: true },
  { name: 'name', label: t('printProgramListDialog.programName'), field: 'name', align: 'left' as const, sortable: true },
  { name: 'stepCount', label: t('printProgramListDialog.stepCount'), field: 'stepCount', align: 'center' as const, sortable: true },
  { name: 'type', label: t('printProgramListDialog.type'), field: (row: any) => getProcessTypeName(row.type), align: 'left' as const, sortable: true },
])

const commandColumns = computed(() => [
  { name: 'commandNo', label: t('printProgramListDialog.commandNo'), field: 'commandNo', align: 'left' as const, sortable: true },
  { name: 'name', label: t('printProgramListDialog.commandName'), field: 'name', align: 'left' as const, sortable: true },
])

function getProcessTypeName(typeValue: number) {
  return editor.allProcessTypes.find(pt => pt.value === typeValue)?.label || ''
}

async function generatePDF() {
  if (!selectedMachine.value) {
    throw new Error('No machine selected')
  }

  const machineId = selectedMachine.value.id
  const machineName = selectedMachine.value.name
  const programNos = selectedPrograms.value.map(p => p.programNo)
  const programs = await getPrograms(machineId, programNos)
  const selectedCommandNos = selectedCommands.value.map(c => c.commandNo)

  const translations = {
    machineNo: t('printProgramListDialog.machineNo'),
    machineName: t('printProgramListDialog.machineName'),
    programNo: t('printProgramListDialog.programNo'),
    programName: t('printProgramListDialog.programName'),
    stepCount: t('printProgramListDialog.stepCount'),
    duration: t('printProgramListDialog.duration'),
    processCode: t('printProgramListDialog.processCode'),
    createdAt: t('printProgramListDialog.createdAt'),
    updatedAt: t('printProgramListDialog.updatedAt'),
    parameter: t('printProgramListDialog.parameter'),
    name: t('printProgramListDialog.name'),
    value: t('printProgramListDialog.value'),
    page: t('printProgramListDialog.page'),
    noSelectedCommands: t('printProgramListDialog.noSelectedCommands'),
  }

  const worker = new Worker(new URL('~/workers/pdf-generator.worker', import.meta.url), { type: 'module' })

  const pdfArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.success) {
        resolve(e.data.data)
      } else {
        reject(new Error(e.data.error))
      }
      worker.terminate()
    }

    worker.onerror = (error) => {
      reject(error)
      worker.terminate()
    }

    worker.postMessage({
      data: {
        machineName,
        machineId,
        // Deep copy: Vue reactive proxy'leri ve circular reference'ları temizleyerek plain object'e çevirir
        programs: JSON.parse(JSON.stringify(programs)),
        selectedCommandNos,
        commandList: JSON.parse(JSON.stringify(commandList.value)),
        translations,
      },
      processTypes: JSON.parse(JSON.stringify(editor.allProcessTypes)),
    })
  })

  const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })
  return blob
}

async function printProgramList() {
  if (isPrinting.value)
    return

  isPrinting.value = true

  try {
    const pdfBlob = await generatePDF()
    const url = URL.createObjectURL(pdfBlob)

    // Yeni pencerede aç ve print
    const printWindow = window.open(url, '_blank')

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
      }
    } else {
      notifyError(t('printProgramListDialog.popupBlocked'))
      URL.revokeObjectURL(url)
    }

    onDialogCancel()
  } catch (error) {
    console.error('Print error:', error)
    notifyError(t('printProgramListDialog.printError'))
  } finally {
    isPrinting.value = false
  }
}

async function downloadProgramList() {
  if (isDownloading.value)
    return

  isDownloading.value = true

  try {
    if (!selectedMachine.value) {
      notifyError(t('printProgramListDialog.noMachineSelected'))
      return
    }

    const pdfBlob = await generatePDF()
    const fileName = `${selectedMachine.value.name}_program_listesi.pdf`

    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)

    onDialogCancel()
  } catch (error) {
    console.error('Download error:', error)
    notifyError(t('printProgramListDialog.downloadError'))
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-120 select-none">
      <!-- Header -->
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('printProgramListDialog.printProgram') }}
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

      <!-- Machine Selection -->
      <q-card-section class="pt-0">
        <CMMachineSelector
          v-model="machineOption"
          :machine-name="props.machineName"
          single-selection
        />
      </q-card-section>

      <!-- Programs Table -->
      <q-card-section class="pt-0">
        <div class="text-sm mb-2">
          {{ t('printProgramListDialog.selectPrograms') }}
        </div>
        <q-table
          v-model:selected="selectedPrograms"
          :rows="programList"
          :columns="programColumns"
          row-key="programNo"
          selection="multiple"
          dense
          flat
          bordered
          virtual-scroll
          :loading="isLoadingPrograms"
          :rows-per-page-options="[0]"
          class="h-50"
          hide-bottom
          hide-pagination
          table-header-style="position: sticky; top: 0; z-index: 1; height: 30px;"
          table-header-class="bg-gray-1 dark:bg-dark-4"
        />
      </q-card-section>

      <!-- Commands Table -->
      <q-card-section class="pt-0">
        <div class="text-sm mb-2">
          {{ t('printProgramListDialog.selectCommands') }}
        </div>
        <q-table
          v-model:selected="selectedCommands"
          :rows="commandList"
          :columns="commandColumns"
          row-key="commandNo"
          selection="multiple"
          dense
          flat
          bordered
          virtual-scroll
          :loading="isLoadingCommands"
          :rows-per-page-options="[0]"
          class="h-50"
          hide-bottom
          hide-pagination
          table-header-style="position: sticky; top: 0; z-index: 1; height: 30px;"
          table-header-class="bg-gray-1 dark:bg-dark-4"
        />
      </q-card-section>

      <!-- Actions -->
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
          :loading="isDownloading"
          class="bg-primary text-white"
          flat
          @click="downloadProgramList()"
        />
        <q-btn
          :label="t('print')"
          :disable="isDisabled"
          :loading="isPrinting"
          class="bg-primary text-white"
          flat
          @click="printProgramList()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
