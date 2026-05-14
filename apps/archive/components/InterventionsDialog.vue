<script setup lang="ts">
import { type QTableColumn, useDialogPluginComponent } from 'quasar'
import type { BatchIntervention } from '~/types/archive'
import { printJobOrderInterventionReport } from '~/utils/pdf'

const props = defineProps<({
  jobOrderNo: string
  startTime: Date | null
  endTime: Date | null
  cancelTime: Date | null
  interventions: BatchIntervention[]
})>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t, d } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const filter = ref('')

const rows = computed(() => (props.interventions ?? []).map(item => toRaw(item)))

const columns: QTableColumn[] = [
  {
    name: 'time',
    align: 'left',
    label: t('date'),
    field: 'time',
    sortable: true,
    format: (val: Date) => d(val, 'datetime'),
  },
  {
    name: 'operator',
    align: 'left',
    label: t('operator'),
    field: 'operator',
    sortable: true,
  },
  {
    name: 'explanation',
    align: 'left',
    label: t('description'),
    field: 'explanation',
    style: 'max-width: 300px; white-space: normal;',
    format: (val: string[]) => val.join(' | '),
  },
]

function printTable() {
  printJobOrderInterventionReport({
    jobOrderNo: props.jobOrderNo,
    startTime: props.startTime,
    endTime: props.endTime,
    cancelTime: props.cancelTime,
    interventions: props.interventions,
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-250" style="max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('interventions') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="flex justify-between">
          <q-input
            v-model="filter"
            :placeholder="t('search')"
            class="w-80"
            clearable
            outlined
            dense
          />
          <q-btn
            :label="t('topbar.graph.print')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            icon="print"
            flat
            @click="printTable"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          :columns
          :rows
          :filter="filter"
          :pagination="{ rowsPerPage: 0 }"
          class="h-120"
          table-header-class="bg-gray-1 dark:bg-dark-4"
          table-header-style="position: sticky; top: 0; z-index: 1; height: 40px;"
          dense
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
