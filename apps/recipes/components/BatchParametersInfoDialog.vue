<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import type { BatchPlanParameter, JobOrder } from '~/shared/types'

const props = defineProps({
  jobOrder: {
    type: Object as PropType<JobOrder>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])

const columnsAuto: (QTableColumn<BatchPlanParameter>)[] = [
  { name: 'planKey', label: t('batchPlanParameterFields.PlanKey'), field: 'planKey' },
  { name: 'paramId', label: t('batchPlanParameterFields.ParamID'), field: 'paramId' },
  { name: 'paramName', label: t('batchPlanParameterFields.ParamName'), field: 'paramName' },
  { name: 'value', label: t('batchPlanParameterFields.Value'), field: 'value' },
  { name: 'unit', label: t('batchPlanParameterFields.Unit'), field: 'unit' },
]
const data = ref<BatchPlanParameter[]>([])
getData()
async function getData() {
  data.value = await $fetch('/api/parameters', { query: { batchNo: props.jobOrder.batchNo, correctionNo: props.jobOrder.batchCorrectionNo } })
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
        :title="t('batchPlanParameterFields.Title')"
        :columns="columnsAuto"
        :rows="data"
        row-key="name"
      />
    </QCard>
  </QDialog>
</template>
