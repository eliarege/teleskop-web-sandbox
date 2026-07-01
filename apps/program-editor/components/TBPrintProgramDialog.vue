<script setup lang="ts">
import type { MachineCommand, MachineGroup, MachineInfo, MachineOption, Program, ProgramTableRow } from '~/shared/types'
import { computeProgramDurations } from '~/shared/formula'
import CMMachineSelector from '~/components/CMMachineSelector.vue'

const props = defineProps<{
  machineId: number
  machineName: string

  allMachines: MachineInfo[]
  machineGroups: MachineGroup[]

  selectedMachines: MachineInfo[]

  programList: ProgramTableRow[]
  commandList: MachineCommand[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const editor = useEditorStore()
const machine = useMachineStore()
const { notifyError } = useNotify()
const { t, locale, messages } = useI18n()
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
    return machine.currentMachine
  } else if (machineOption.value === 'selected' && machine.selectedMachines.length > 0) {
    return machine.selectedMachines[0]
  }
  return null
})

const isDisabled = computed(() =>
  machineOption.value === 'selected' && !machine.selectedMachines.length
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
  if (!selectedMachine.value)
    return

  isLoadingPrograms.value = true
  selectedPrograms.value = []

  try {
    programList.value = await editor.fetchAllPrograms(selectedMachine.value.id)
  } finally {
    isLoadingPrograms.value = false
  }
}

async function loadCommandList() {
  if (!selectedMachine.value)
    return

  isLoadingCommands.value = true
  selectedCommands.value = []

  try {
    const machineData = await machine.fetchMachine(selectedMachine.value.id)
    commandList.value = Array.from(machineData.commands.values())
  } finally {
    isLoadingCommands.value = false
  }
}

async function getPrograms(machineId: number, programNos: number[]): Promise<Program[]> {
  return await editor.fetchPrograms(machineId, programNos)
}

watch([machineOption, () => machine.selectedMachines], loadData)

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

// Prepare translations for the PDF
const processed = buildTranslations(messages.value, locale.value, t, 'printProgramListDialog')

const teleskopSettings = useTeleskopSettingsStore()

/**
 * Verilen programlar için adım bazlı süre bilgisini hesaplar.
 */
async function computeDurationsForPrograms(programs: Program[], machineId: number) {
  const fullMachine = await machine.fetchMachine(machineId)
  return programs.map(p => computeProgramDurations(p, fullMachine, teleskopSettings.initialTemperature ?? 25))
}

async function downloadProgram() {
  if (isDownloading.value)
    return

  isDownloading.value = true
  try {
    if (!selectedMachine.value) {
      notifyError(t('printProgramListDialog.noMachineSelected'))
      return
    }

    const machine = selectedMachine.value
    const programNos = selectedPrograms.value.map(p => p.programNo)
    const programs = await getPrograms(machine.id, programNos)
    const selectedCommandNos = selectedCommands.value.map(c => c.commandNo)

    const programDurations = await computeDurationsForPrograms(programs, machine.id)

    const payload = {
      machine,
      programs,
      selectedCommandNos,
      commandList: commandList.value,
      translations: processed,
      locale: locale.value,
      processTypes: editor.allProcessTypes,
      programDurations,
    }

    const programDetailPDF = await generateProgramPDF('PROGRAM_DETAIL', payload)
    const fileName = programs.length === 1
      ? `${selectedMachine.value.name}_${programs[0].name}.pdf`
      : `${selectedMachine.value.name}_${t('printProgramListDialog.output.programs')}.pdf`

    downloadPDF(programDetailPDF, fileName)
  } catch (error) {
    console.error('Download error:', error)
    notifyError(t('printProgramListDialog.downloadError'))
  } finally {
    isDownloading.value = false
  }
}

async function printProgram() {
  if (isPrinting.value)
    return

  isPrinting.value = true

  try {
    if (!selectedMachine.value) {
      notifyError(t('printProgramListDialog.noMachineSelected'))
      return
    }

    const machine = selectedMachine.value
    const programNos = selectedPrograms.value.map(p => p.programNo)
    const programs = await getPrograms(machine.id, programNos)
    const selectedCommandNos = selectedCommands.value.map(c => c.commandNo)

    const programDurations = await computeDurationsForPrograms(programs, machine.id)

    const payload = {
      machine,
      programs,
      selectedCommandNos,
      commandList: commandList.value,
      translations: processed,
      locale: locale.value,
      processTypes: editor.allProcessTypes,
      programDurations,
    }

    const programDetailPdf = await generateProgramPDF('PROGRAM_DETAIL', payload)

    printPDF(programDetailPdf)
  } catch (error) {
    console.error('Print error:', error)
    notifyError(t('printProgramListDialog.printError'))
  } finally {
    isPrinting.value = false
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
          :machine-id="props.machineId"
          :machine-name="props.machineName"

          :all-machines="props.allMachines"
          :machine-groups="props.machineGroups"

          :selected-machines="props.selectedMachines"
          single-selection
          @update:selected-machines="(machines: MachineInfo[]) => {
            machineOption = 'selected'
            machine.selectedMachines = machines
          }"
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
          @click="downloadProgram()"
        />
        <q-btn
          :label="t('print')"
          :disable="isDisabled"
          :loading="isPrinting"
          class="bg-primary text-white"
          flat
          @click="printProgram()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
