<script setup lang="ts">
import { cellRGBColorHandler } from '../shared/functions'
import { colors } from '~/shared/constants'

const props = defineProps({
  joborder: String,
  programNo: Number,
  mainStep: Number,
  data: Array<any>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const { t, d } = useI18n()

const rerequestedStepCols = computed(() => [
  {
    name: 'joborder',
    label: t('joborder'),
    field: 'joborder',
  },
  {
    name: 'correctionNo',
    label: t('correctionNo'),
    field: 'correctionNo',
  },
  {
    name: 'mainStep',
    label: t('recipe.mainStep'),
    field: 'mainStep',
  },
  {
    name: 'status',
    label: t('statusCodes.text'),
    field: 'status',
    format: (val, row) => t(`statusCodes.${val}`) !== `statusCodes.${val}` ? t(`statusCodes.${val}`) : '',
    style: row => cellRGBColorHandler(row.status),
  },
  {
    name: 'requestTime',
    label: t('requestTime'),
    field: 'requestTime',
    format: (val, row) => val ? d(val, 'datettime') : '_'.repeat(4),
  },
  {
    name: 'endTime',
    label: t('endtime'),
    field: 'endTime',
    format: (val, row) => val ? d(val, 'datettime') : '_'.repeat(4),
  },
])
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="prev-logs-class"
    persistent
  >
    <q-card>
      <q-card-section class="flex flex-col">
        <span class="text-h5"> {{ t('dispensingManager._') }} - {{ t('recipe.previousRequests') }}</span>
        <span class="text-h6">{{ `${t('recipe.stepReInfo')} - (${t('joborder')}: ${props.joborder}) - (${t('programNo')}: ${props.programNo}) - (${t('dispensingManager.stepNo')}: ${props.mainStep})` }}</span>
      </q-card-section>
      <q-card-section>
        <FilterableTable
          :columns="rerequestedStepCols"
          :rows="data"
          title-class="font-size-4.5"
        >
          <template #custombody="props">
            <q-tr
              :props="props"
              :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : ''"
            >
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.value }}
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('close')"
          outline
          icon="close"
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
