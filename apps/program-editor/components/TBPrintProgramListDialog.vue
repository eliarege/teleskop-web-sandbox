<script setup lang="ts">
import type { MachineInfo, MachineOption } from '~/shared/types'

const props = defineProps<{
  machineName: string
}>()

defineEmits([...useDialogPluginComponent.emits])

const editor = useEditorStore()
const machine = useMachineStore()
const { notifyError } = useNotify()
const { t, messages, locale } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const machineOption = ref<MachineOption>('current')
const isPrinting = ref(false)
const isDownloading = ref(false)

const selectedMachines = computed<{ id: number, name: string }[]>(() =>
  machineOption.value === 'current'
    ? [{
        id: machine.currentMachine.id,
        name: machine.currentMachine.name,
      }]
    : machine.selectedMachines.map(machine => ({ id: machine.id, name: machine.name })),
)

const isDisabled = computed(() =>
  machineOption.value === 'selected' && machine.selectedMachines.length === 0
  || isPrinting.value
  || isDownloading.value,
)

// Prepare translations for the PDF
const processed = buildTranslations(messages.value, locale.value, t, 'printProgramListDialog')

async function printProgramList() {
  if (isPrinting.value)
    return

  isPrinting.value = true

  try {
    const payload = {
      machines: await Promise.all(
        selectedMachines.value.map(async machine => ({
          id: machine.id,
          name: machine.name,
          programs: await editor.fetchAllPrograms(machine.id),
        })),
      ),
      translations: processed,
      locale: locale.value,
      processTypes: editor.allProcessTypes,
    }

    const programListPDF = await generateProgramPDF('PROGRAM_LIST', payload)

    printPDF(programListPDF)
  } catch (error) {
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
    const payload = {
      machines: await Promise.all(
        selectedMachines.value.map(async machine => ({
          id: machine.id,
          name: machine.name,
          programs: await editor.fetchAllPrograms(machine.id),
        })),
      ),
      translations: processed,
      locale: locale.value,
      processTypes: editor.allProcessTypes,
    }

    const programListPDF = await generateProgramPDF('PROGRAM_LIST', payload)
    const fileName = machineOption.value === 'current'
      ? `${machine.currentMachine.name}_${t('printProgramListDialog.output.programList')}.pdf`
      : `${t('printProgramListDialog.output.programList')}.pdf`

    downloadPDF(programListPDF, fileName)
  } catch (error) {
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
          v-close-popup
          :label="t('download')"
          :disable="isDisabled"
          :loading="isDownloading"
          class="bg-primary text-white"
          flat
          @click="downloadProgramList()"
        />
        <q-btn
          v-close-popup
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
