<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import type { ContinueJobOrderParams, JobOrder } from '~/shared/types'

const props = defineProps({
  jobOrder: {
    type: Object as PropType<JobOrder>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()

const columnsAuto: (QTableColumn<ContinueJobOrderParams>)[] = [
  { name: 'jobNo', label: t('jobOrderParams.ID'), field: 'jobNo' },
  { name: 'fabricSize', label: t('jobOrderParams.FabricSize'), field: 'fabricSize' },
  { name: 'fabricWeight', label: t('jobOrderParams.FabricWeight'), field: 'fabricWeight' },
  { name: 'grammage', label: t('jobOrderParams.Grammage'), field: 'grammage' },
  { name: 'flotte', label: t('jobOrderParams.Flotte'), field: 'flotte' },
  { name: 'foulard', label: t('jobOrderParams.Foulard'), field: 'foulard' },
  { name: 'Volume', label: t('jobOrderParams.Volume'), field: 'volume' },
  { name: 'colorCode', label: t('jobOrderParams.ColorCode'), field: 'colorCode' },
  { name: 'startDate', label: t('jobOrderParams.StartDate'), field: 'startDate' },
]
const data = ref<ContinueJobOrderParams[]>([])
getData()
async function getData() {
  data.value = await $fetch('/api/job-orders/continue/info', { query: { jobNo: props.jobOrder.batchNo } })
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
        class="p-10"
        separator="cell"
        :title="t('Info')"
        :columns="columnsAuto"
        :rows="data"
        row-key="name"
        hide-bottom
      />
    </QCard>
  </QDialog>
</template>
