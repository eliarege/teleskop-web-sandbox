<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { ERPParameterDefinition } from '../types/archive'

const props = defineProps<{
  erpParameters: ERPParameterDefinition[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const parameters = ref<ERPParameterDefinition[]>(props.erpParameters)
const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => parameters.value.forEach(p => p.batchReportVisible = true),
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () => parameters.value.forEach(p => p.batchReportVisible = false),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => parameters.value.forEach(p => p.batchReportVisible = !p.batchReportVisible),
  },
]
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="min-w-120">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('jobOrderSummarySettings._') }}
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
        <div class="text-h8 w-100 color-gray-6">
          {{ t('jobOrderSummarySettings.description') }}
        </div>
      </q-card-section>

      <q-card-section class="pr-10 py-0">
        <div class="flex justify-end mb-2">
          <q-btn
            v-for="(button, index) in buttons"
            :key="index"
            dense
            flat
            @click="button.onClick()"
          >
            <q-icon :name="button.icon" size="xs" />
            <q-tooltip> {{ button.tooltip }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="param in parameters"
            :key="`erp-${param.paramId}`"
            class="text-sm cursor-pointer border rounded mb-2 p-2 flex items-center"
            @click="param.batchReportVisible = !param.batchReportVisible"
          >
            <q-checkbox
              v-model="param.batchReportVisible"
              :label="param.paramName"
              size="sm"
              dense
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('save')"
          class="bg-primary text-white"
          flat
          @click="onDialogOK(parameters)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
  .q-dialog__inner--minimized > div {
  max-width: none;
}
</style>
