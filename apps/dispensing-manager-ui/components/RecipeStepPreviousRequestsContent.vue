<script setup lang="ts">
import moment from 'moment'
import FilterableTable from 'ui/components/FilterableTable.vue'
import { rowBGColorHandler } from '../shared/functions'
import { colors } from '~/shared/constants'

const props = defineProps({
  joborder: String,
  programNo: Number,
  programStepNo: Number,
})

const { t } = useI18n()
const data = await $fetch('/api/recipe/previous-requests', {
  method: 'POST',
  body: props,
})
const rerequestedStepCols = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo' },
  { name: 'mainStep', label: t('recipe.mainStep'), field: 'mainStep' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
  { name: 'requestTime', label: t('requestTime'), field: 'requestTime' },
  { name: 'endTime', label: t('endtime'), field: 'endTime' },
]
const autoWeiStepCols = [
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'parallelStep', label: t('recipe.parallelStep'), field: 'parallelStep' },
  { name: 'dispenser', label: t('settings.dispName'), field: 'dispenser' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
  { name: 'recipeAmount', label: t('recipeAmount'), field: 'recipeAmount' },
  { name: 'actualAmount', label: t('actualAmount'), field: 'actualAmount' },
]
const manuelWeiStepCols = [
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'mainStep', label: t('recipe.mainStep'), field: 'mainStep' },
  { name: 'parallelStep', label: t('recipe.parallelStep'), field: 'parallelStep' },
  { name: 'weighingNumber', label: t('weighingInformation.weighingNumber'), field: 'weighingNumber' },
  { name: 'recipeAmount', label: t('recipeAmount'), field: 'recipeAmount' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]
</script>

<template>
  <div>
    <q-card>
      <q-card-section class="flex flex-col">
        <span class="text-h5"> {{ t('dispensingManager._') }} - {{ t('recipe.previousRequests') }}</span>
        <span class="text-h6">{{ `${t('recipe.stepReInfo')} - (${t('joborder')}: ${props.joborder}) - (${t('programNo')}: ${props.programNo}) - (${t('dispensingManager.stepNo')}: ${props.programStepNo})` }}</span>
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
                :style="rowBGColorHandler(col)"
              >
                <span v-if="col.field === 'requestTime' || col.field === 'endTime'">
                  {{ col.value ? moment(col.value).format('HH:m:ss DD/MM/YYYY') : '____' }}
                </span>
                <span v-else-if="col.field === 'status'">
                  {{ t(`statusCodes.${col.value}`) }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </q-card-section>
      <!-- <q-card-section>
        <q-table
          :title="t('recipe.autoWeiDetails')"
          :columns="autoWeiStepCols"
        />
      </q-card-section>
      <q-card-section>
        <q-table
          :title="t('recipe.manuelWeiDetails')"
          :columns="manuelWeiStepCols"
        />
      </q-card-section> -->

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('close')"
          outline
          icon="close"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
