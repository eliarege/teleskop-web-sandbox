<script setup lang="ts">
import { jsPDF } from 'jspdf'
import type { MachineCommand, Program, ProgramTableRow } from '~/shared/types'
import { formatDuration } from '~/composables/utils'

const props = defineProps<{
  machineName: string
  programList: ProgramTableRow[]
  commandList: MachineCommand[]
}>()

const $q = useQuasar()
const editor = useEditorStore()
const { t } = useI18n()
const { notifyError } = useNotify()
const { $commandManager } = useNuxtApp()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const machineOption = ref<string>('1')

const programList = ref<ProgramTableRow[]>(props.programList)
const isLoadingPrograms = ref(false)
const selectedPrograms = ref<ProgramTableRow[]>([])

const commandList = ref<MachineCommand[]>(props.commandList)
const isLoadingCommands = ref(false)
const selectedCommands = ref<any[]>(props.commandList)

const selectedMachine = computed(() => {
  if (machineOption.value === '1') {
    return editor.machine
  } else if (machineOption.value === '2' && editor.selectedMachines.length > 0) {
    return editor.selectedMachines[0]
  }
  return null
})

const isDisabled = computed(() =>
  machineOption.value === '2' && !editor.selectedMachines.length
  || selectedPrograms.value.length === 0
  || selectedCommands.value.length === 0,
)

const selectMachineDialog = () => $commandManager.executeCommand('selectMachine', { $q }, { singleSelection: true })

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

async function getPrograms(machineId: number, programNos: number[]) {
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
  const doc = new jsPDF() as any // eslint-disable-line new-cap
  let startY = 10

  if (!selectedMachine.value) {
    throw new Error('No machine selected')
  }

  const machineId = selectedMachine.value.id
  const machineName = selectedMachine.value.name
  const programNos = selectedPrograms.value.map(p => p.programNo)
  const programs = await getPrograms(machineId, programNos)

  // Seçilen komut numaralarını al
  const selectedCommandNos = selectedCommands.value.map(c => c.commandNo)

  // Her program için
  programs.forEach((program, programIndex) => {
    if (programIndex > 0) {
      doc.addPage()
    }
    startY = 10

    // Makine ve Program Başlık Kutusu
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(14, startY, 182, 23)

    // Başlık içeriği
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')

    // İlk satır: Makine No ve Makine Adı
    doc.text(`${t('printProgramListDialog.machineNo')}`, 20, startY + 5)
    doc.text(`: ${machineId}`, 50, startY + 5)
    doc.text(`${t('printProgramListDialog.machineName')}`, 80, startY + 5)
    doc.text(`: ${machineName}`, 105, startY + 5)

    // İkinci satır: Program No ve Program Adı
    doc.text(`${t('printProgramListDialog.programNo')}`, 20, startY + 10)
    doc.text(`: ${program.programNo}`, 50, startY + 10)
    doc.text(`${t('printProgramListDialog.programName')}`, 80, startY + 10)
    doc.text(`: ${program.name}`, 105, startY + 10)

    // Üçüncü satır: Adım Sayısı, Süre, Proses Kodu
    doc.text(`${t('printProgramListDialog.stepCount')}`, 20, startY + 15)
    doc.text(`: ${program.steps.length}`, 50, startY + 15)
    doc.text(`${t('printProgramListDialog.duration')}`, 80, startY + 15)
    doc.text(`: ${formatDuration(program.duration)}`, 100, startY + 15)
    doc.text(`${t('printProgramListDialog.processCode')}`, 130, startY + 15)
    doc.text(`: ${getProcessTypeName(program.typeId)}`, 160, startY + 15)

    // Dördüncü satır: Oluşturma ve Değiştirme Tarihleri
    doc.setFontSize(9)
    doc.text(`${t('printProgramListDialog.createdAt')}`, 20, startY + 20)
    doc.text(`: ${program.createdAt ? new Date(program.createdAt).toLocaleString('tr-TR') : '-'}`, 50, startY + 20)
    doc.text(`${t('printProgramListDialog.updatedAt')}`, 110, startY + 20)
    doc.text(`: ${program.updatedAt ? new Date(program.updatedAt).toLocaleString('tr-TR') : '-'}`, 145, startY + 20)

    startY += 30

    // Programdaki adımları filtrele - sadece seçilen komutları içerenleri al
    const filteredSteps: any[] = []
    let stepNumber = 1

    program.steps.forEach((step) => {
      // Ana komut seçili mi kontrol et
      if (selectedCommandNos.includes(step.mainCommand.commandNo)) {
        const mainCommandInfo = commandList.value.find(cmd => cmd.commandNo === step.mainCommand.commandNo)

        if (mainCommandInfo) {
          filteredSteps.push({
            stepNumber,
            commandNo: step.mainCommand.commandNo,
            commandName: mainCommandInfo.name,
            parameters: step.mainCommand.parameters,
            ioList: step.mainCommand.ioList,
            commandInfo: mainCommandInfo,
            isParallel: false,
          })

          // Bu ana komutun paralel komutlarını ekle
          step.parallelCommands.forEach((parallelCmd) => {
            const parallelCommandInfo = commandList.value.find(cmd => cmd.commandNo === parallelCmd.commandNo)
            if (parallelCommandInfo) {
              filteredSteps.push({
                stepNumber,
                commandNo: parallelCmd.commandNo,
                commandName: parallelCommandInfo.name,
                parameters: parallelCmd.parameters,
                ioList: parallelCmd.ioList,
                commandInfo: parallelCommandInfo,
                isParallel: true,
              })
            }
          })

          stepNumber++
        }
      }
    })

    // Eğer bu programda seçili komut varsa detayları göster
    if (filteredSteps.length > 0) {
      filteredSteps.forEach((step) => {
        // Sayfa kontrolü
        if (startY > 250) {
          doc.addPage()
          startY = 15
        }

        // Adım ve Komut Başlığı
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const stepText = step.isParallel ? '' : `${step.stepNumber}    `
        const leftMargin = step.isParallel ? 60 : 14
        doc.text(`${stepText}    ${step.commandNo}  ${step.commandName}`, leftMargin, startY)

        startY += step.parameters.length > 0 || step.ioList.length > 0 ? 4 : 1

        // Parametreler
        if (step.parameters && step.parameters.length > 0) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(t('printProgramListDialog.parameter'), 80, startY)
          doc.text(t('printProgramListDialog.name'), 110, startY)
          doc.text(t('printProgramListDialog.value'), 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('helvetica', 'normal')
          step.parameters.forEach((param: any) => {
            const paramInfo = step.commandInfo.parameters.find((p: any) => p.index === param.index)
            if (paramInfo && startY < 280) {
              doc.text(paramInfo.name || '-', 110, startY)
              doc.text(String(param.value || '0'), 150, startY)
              startY += 4
            }
          })
          startY -= 2
        }

        // IO Listesi
        if (step.ioList && step.ioList.length > 0) {
          if (startY > 250) {
            doc.addPage()
            startY = 15
          }

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('IO', 80, startY)
          doc.text(t('printProgramListDialog.name'), 110, startY)
          doc.text(t('printProgramListDialog.value'), 150, startY)
          startY += 1

          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          doc.line(80, startY, 196, startY)
          startY += 4

          doc.setFont('helvetica', 'normal')
          step.ioList.forEach((io: any) => {
            const ioInfo = step.commandInfo.ioList.find((i: any) => i.index === io.ioIndex)
            if (ioInfo && startY < 280) {
              doc.text(ioInfo.name || '-', 110, startY)
              // IO value formatı: [[index, value]]
              const ioValue = io.value && io.value.length > 0
                ? io.value.map((v: any) => ioInfo.selections.find((s: any) => s.index === v[0])?.name || v[1]).join(', ')
                : '-'
              doc.text(ioValue, 150, startY)
              startY += 4
            }
          })
          startY -= 2
        }

        // startY += 1

        // Ayırıcı çizgi
        if (startY < 280) {
          doc.setDrawColor(200)
          doc.setLineWidth(0.1)
          const lineStartX = step.isParallel ? 60 : 14
          doc.line(lineStartX, startY, 196, startY)
          startY += 4
        }
      })
    } else {
      // Seçili komut yoksa bilgi mesajı
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text(t('printProgramListDialog.noSelectedCommands'), 14, startY)
    }
  })

  // Tüm sayfalara sayfa numarası ekle
  const pageCount = doc.internal.getNumberOfPages()
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
    if (!selectedMachine.value) {
      notifyError(t('printProgramListDialog.noMachineSelected'))
      return
    }

    const doc = await generatePDF()
    const fileName = `${selectedMachine.value.name}_program_listesi.pdf`
    doc.save(fileName)
    onDialogCancel()
  } catch (error) {
    console.error('Download error:', error)
    notifyError(t('printProgramListDialog.downloadError'))
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    persistent
  >
    <q-card class="w-120 select-none">
      <!-- Header -->
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

      <!-- Machine Selection -->
      <q-card-section class="pt-0">
        <div class="m-2">
          <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
            {{ t('printProgramListDialog.machineOption') }}
          </label>
          <div class="q-gutter-sm">
            <q-radio
              v-model="machineOption"
              val="1"
              :label="t('printProgramListDialog.thisMachine', { machineName: props.machineName })"
              dense
            />
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <q-radio
                  v-model="machineOption"
                  val="2"
                  :label="t('printProgramListDialog.selectedMachines')"
                  dense
                />
                <q-btn
                  :label="t('printProgramListDialog.selectMachine')"
                  :disable="machineOption !== '2'"
                  color="primary"
                  size="sm"
                  outline
                  dense
                  @click="selectMachineDialog()"
                />
              </div>

              <div v-if="editor.selectedMachines.length > 0" class="pl-6 pt-1">
                <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
                  <span class="font-medium">
                    {{ t('printProgramListDialog.machinesSelected', { count: editor.selectedMachines.length }) }}
                  </span>
                  <q-tooltip
                    class="bg-white text-dark shadow-4 text-body2"
                    anchor="top middle"
                    self="bottom middle"
                  >
                    <div class="q-pa-sm">
                      <div class="text-weight-medium q-mb-xs">
                        {{ t('printProgramListDialog.selectedMachinesList') }}:
                      </div>
                      <div
                        v-for="machine in editor.selectedMachines"
                        :key="machine.id"
                        class="q-mb-xs"
                      >
                        • {{ machine.name }}
                      </div>
                    </div>
                  </q-tooltip>
                </div>
              </div>
              <div v-else class="pl-6 pt-1">
                <div class="text-xs text-grey-6 dark:text-grey-4 italic">
                  {{ t('printProgramListDialog.noMachinesSelected') }}
                </div>
              </div>
            </div>
          </div>
        </div>
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
