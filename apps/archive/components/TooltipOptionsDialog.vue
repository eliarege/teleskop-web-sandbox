<script setup lang="ts">
import { ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const settingsStore = userSettingsStore()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const tooltipOptions = computed(() => [
  { label: t('tooltipOptions.markedAnalogInputs'), value: 1 },
  { label: t('tooltipOptions.markedAnalogOutputs'), value: 2 },
  { label: t('tooltipOptions.markedCalcualtedValues'), value: 3 },
  { label: t('tooltipOptions.selectedTime'), value: 4 },
  { label: t('tooltipOptions.currentDuration'), value: 5 },
  { label: t('tooltipOptions.activeUser'), value: 6 },
  { label: t('tooltipOptions.activeCommandTimeInfo'), value: 7 },
  { label: t('tooltipOptions.manuelMeasuredValues'), value: 8 },
])

const selectedOptions = ref([...settingsStore.tooltipSettings])

function confirmSelection(data: number[]) {
  settingsStore.updateTooltipSettings(data)
  onDialogOK()
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="min-w-[300px]" style="max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('tooltipOptions.title') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 mb-2 color-gray-6">
          {{ t('tooltipOptions.message') }}
        </div>

        <div v-for="option in tooltipOptions" :key="option.value">
          <q-checkbox
            v-model="selectedOptions"
            :val="option.value"
            :label="option.label"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <q-btn
          flat
          :label="t('cancel')"
          @click="onDialogCancel"
        />
        <q-btn
          unelevated
          :label="t('save')"
          color="primary"
          @click="confirmSelection(selectedOptions)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
