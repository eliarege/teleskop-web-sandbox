<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import CMMachineSelector from './CMMachineSelector.vue'
import type { MachineInfo, MachineOption, PasteOptions } from '~/shared/types'

const props = defineProps<{
  machineName: string
  type: string
  selectedMachines: MachineInfo[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const machineOption = ref<MachineOption>('current')

// Program yapıştırma seçenekleri
const pasteOption = ref<PasteOptions>('overwrite') // default: var olan programın üzerine yaz
const pasteOptions: { label: string, value: PasteOptions }[] = [
  {
    label: t('contextMenu.copyAndSend.dialog.pasteOverwrite'),
    value: 'overwrite',
  },
  {
    label: t('contextMenu.copyAndSend.dialog.pasteSkip'),
    value: 'skip',
  },
]
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard>
      <QCardSection class="w-100">
        <div class="text-h6 flex">
          {{ t('contextMenu.copyToMachinesAndSend') }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <QCardSection>
        <CMMachineSelector
          :model-value="machineOption"
          :machine-name="props.machineName"
          :selected-machines="props.selectedMachines"
        />
      </QCardSection>

      <!-- Program Paste Options -->
      <QCardSection class="text-gray-8 dark:text-gray-3">
        <div class="text-subtitle1 text-weight-medium">
          {{ t('contextMenu.copyAndSend.dialog.pasteOptions') }}
        </div>
        <q-option-group
          v-model="pasteOption"
          :options="pasteOptions"
          type="radio"
          dense
        />
      </QCardSection>

      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          class="q-mr-sm text-gray-1 dark:text-gray-2 bg-primary"
          :disabled="selectedMachines.length === 0"
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK({ machines: selectedMachines, pasteOption })"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
