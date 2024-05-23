<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import type { JobOrder, WeighingAuto, WeighingManual } from '~/shared/types'
import { cellStyle } from '~/shared/utils'
import { useColorStore } from '~/store/Colors'

const props = defineProps({
  jobOrder: {
    type: Object as PropType<JobOrder>,
    required: true,
  },
})
const q = useQuasar()
const { t, d } = useI18n()
const colorStore = useColorStore()
const { dialogRef, onDialogHide } = useDialogPluginComponent()

const columnsAuto: (QTableColumn<WeighingAuto>)[] = [
  { name: 'jobId', label: t('ProgramNo'), field: 'programNo' },
  { name: 'machineName', label: t('machineFields.Name'), field: 'machineName' },
  { name: 'dispenserId', label: t('dispenserFields.ID'), field: 'dispenserId', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'recipeIndex', label: t('recipeFields.ProcessOrder'), field: 'processOrder' },
  { name: 'mainStep', label: t('weighingFields.MainStep'), field: 'mainStep' },
  { name: 'parallelStep', label: t('weighingFields.ParallelStep'), field: 'parallelStep' },
  { name: 'materialCode', label: t('materialFields.Code'), field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), field: 'materialName' },
  { name: 'recipeAmount', label: t('weighingFields.RecipeAmount'), field: 'recipeAmount' },
  { name: 'actualAmount', label: t('weighingFields.ActualAmount'), field: 'actualAmount', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'status', label: t('Status'), field: 'status' },
  {
    name: 'requestTime',
    label: t('weighingFields.RequestTime'),
    field: 'requestTime',
    format: (val) => {
      return val ? d(val, 'datetime') : '_'.repeat(4)
    },
  },
  {
    name: 'completedTime',
    label: t('weighingFields.CompletedTime'),
    field: 'completedTime',
    format: (val) => {
      return val ? d(val, 'datetime') : '_'.repeat(4)
    },
  },
  {
    name: 'interval',
    label: t('weighingFields.Interval'),
    field: 'interval',
    format: (val) => {
      return !val ? '____' : `${Math.floor(val / 3600)} ${t('weighingFields.Hour')} ${Math.floor(val / 60)} ${t('weighingFields.Minute')} ${val % 60} ${t('weighingFields.Second')}`
    },
  },
]
const columnsManual: (QTableColumn<WeighingManual>[]) = [
  { name: 'jobOrder', label: t('JobOrder'), field: 'batchNo' },
  { name: 'correctionNo', label: t('BatchCorrectionNo'), field: 'correctionNo' },
  { name: 'weighingNumber', label: t('weighingFields.No'), field: 'weighingNumber' },
  { name: 'recipeType', label: t('RecipeType'), field: 'recipeType', format: (val, row) => t(`recipeTypes.${val}`) },
  { name: 'materialCode', label: t('materialFields.Code'), field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), field: 'materialName' },
  { name: 'actualAmount', label: t('weighingFields.RecipeAmount'), field: 'actualAmount', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'status', label: t('Status'), field: 'status' },
  {
    name: 'requestTime',
    label: t('weighingFields.RequestTime'),
    field: 'requestTime',
    format: (val) => {
      return d(val, 'datetime')
    },
  },
]
const autoData = ref<WeighingAuto[]>([])
const manualData = ref<WeighingManual[]>([])
getData()
async function getData() {
  autoData.value = await $fetch(`/api/weighing/auto?batchNo=${props.jobOrder.batchNo}&correctionNo=${props.jobOrder.batchCorrectionNo}`)
  manualData.value = await $fetch(`/api/weighing/manual?batchNo=${props.jobOrder.batchNo}&correctionNo=${props.jobOrder.batchCorrectionNo}`)
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <QTable
        flat
        bordered
        separator="cell"
        :title="t('weighingFields.Auto')"
        :columns="columnsAuto"
        :rows="autoData"
        row-key="name"
      >
        <template #body-cell="tableProps">
          <QTd
            :props="tableProps"
            :style="cellStyle(tableProps.col, tableProps.row, tableProps.pageIndex, false, q.dark.isActive, colorStore.colors)"
          >
            <span v-if="tableProps.col.field === 'status'">
              {{ t(`statusCodes.${tableProps.value}`) }}
            </span>
            <span v-else>
              {{ tableProps.value }}
            </span>
          </QTd>
        </template>
      </QTable>
      <QTable
        flat
        bordered
        class="mt-20"
        separator="cell"
        :title="t('weighingFields.Manual')"
        :columns="columnsManual"
        :rows="manualData"
        row-key="name"
      >
        <template #body-cell="tableProps">
          <QTd
            :props="tableProps"
            :style="cellStyle(tableProps.col, tableProps.row, tableProps.pageIndex, false, q.dark.isActive, colorStore.colors)"
          >
            <span v-if="tableProps.col.field === 'status'">
              {{ t(`statusCodes.${tableProps.value}`) }}
            </span>
            <span v-else>
              {{ tableProps.value }}
            </span>
          </QTd>
        </template>
      </QTable>
    </QCard>
  </QDialog>
</template>
