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

// Program Paste Options
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
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card>
      <q-card-section class="w-100">
        <div class="text-h6 flex">
          {{ t('contextMenu.copyToMachinesAndSend') }}
          <q-space />
          <q-btn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <CMMachineSelector
          :model-value="machineOption"
          :machine-name="props.machineName"
          :selected-machines="props.selectedMachines"
        />
      </q-card-section>

      <!-- Program Paste Options -->
      <q-card-section class="pt-0">
        <div class="mx-2">
          <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
            {{ t('contextMenu.copyAndSend.dialog.pasteOptions') }}
          </label>

          <q-option-group
            v-model="pasteOption"
            :options="pasteOptions"
            type="radio"
            dense
            class="column q-gutter-sm"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          class="q-mr-sm text-gray-1 dark:text-gray-2 bg-primary"
          :disabled="selectedMachines.length === 0"
          :label="t(`contextMenu.${props.type}.operate`)"
          flat
          @click="onDialogOK({ machines: selectedMachines, pasteOption })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
