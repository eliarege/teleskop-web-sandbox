<script setup lang="ts">
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { rowBGColorHandler } from '../shared/functions'
import { colors } from '~/shared/constants'

const props = defineProps({
  joborder: String,
  machinename: String,
  correctionNo: Number,
})
const { t } = useI18n()

const columnsOto = [
  { name: 'processNo', label: t('recipe.processNo'), field: 'processNo' },
  { name: 'machinename', label: t('machinename'), field: 'machinename' },
  { name: 'tankNo', label: t('tankNo'), field: 'tankNo' },
  { name: 'processIndex', label: t('recipe.processOrder'), field: 'processIndex' },
  { name: 'mainStep', label: t('weighingInformation.mainStep'), field: 'mainStep' },
  { name: 'parallelStep', label: t('weighingInformation.parallelStep'), field: 'parallelStep' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'recipeAmount', label: t('recipeAmount'), field: 'recipeAmount' },
  { name: 'actualAmount', label: t('actualAmount'), field: 'actualAmount' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
  { name: 'requestTime', label: t('requestTime'), field: 'requestTime' },
  { name: 'completedTime', label: t('weighingInformation.completionTime'), field: 'completedTime' },
  { name: 'interval', label: t('weighingInformation.passingTime'), field: 'interval' },
  { name: 'otoMan', label: t('weighingInformation.otoMan'), field: 'otoMan' },
]

const columnsMan = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo' },
  { name: 'weighingNumber', label: t('weighingInformation.weighingNumber'), field: 'weighingNumber' },
  { name: 'recipeType', label: t('recipeType'), field: 'recipeType' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'actualAmount', label: t('recipeAmount'), field: 'actualAmount' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
  { name: 'requestTime', label: t('requestTime'), field: 'requestTime' },
]
const data = await $fetch(`/api/consumption/theoretical?joborder=${props.joborder}&correctionNo=${props.correctionNo}`)
const data2 = await $fetch(`/api/consumption/manual?joborder=${props.joborder}&correctionNo=${props.correctionNo}`)
</script>

<template>
  <q-card class="column flex flex-column relative">
    <q-card-section class="text-override-left flex-grow">
      <div class="text-h6 ml-7 mt-3">
        {{ t('jobOrderLogs._') }} -
        <span v-if="joborder">
          {{ t('joborder') }} : {{ joborder }} -
        </span>
        <span v-if="props.machinename">
          {{ t('machinename') }} : {{ props.machinename }}
        </span>
      </div>
      <div class="m-5">
        <q-table
          :columns="columnsOto"
          :rows="data"
          virtual-scroll
          flat
          bordered
          :virtual-scroll-sticky-size-start="48"
          :title="t('weighingInformation.oto') + t('weighingInformation._')"
        >
          <template #body="props">
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
                <span v-if="col.field === 'requestTime' || col.field === 'completedTime'">
                  {{ col.value ? moment(col.value).format('HH:m:ss DD/MM/YYYY') : '____' }}
                </span>
                <span v-else-if="col.field === 'status'">
                  {{ t(`statusCodes.${col.value}`) }}
                </span>
                <span v-else-if="col.field === 'tankNo'">
                  {{ (col.value === -1) ? '____' : col.value }}
                </span>
                <span v-else-if="col.field === 'actualAmount'">
                  {{ (col.value === -1) ? '____' : col.value }}
                </span>
                <span v-else-if="col.field === 'interval'">
                  {{ (!col.value) ? '____'
                    : `${Math.floor(col.value / 60)} ${t('hour')} ${col.value % 60} ${t('min')}`
                  }}
                </span>
                <span v-else-if="col.field === 'otoMan'">
                  {{ col.value ? t('weighingInformation.oto') : t('weighingInformation.man') }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <div class="m-5">
        <q-table
          :columns="columnsMan"
          :rows="data2"
          virtual-scroll
          flat
          bordered
          :virtual-scroll-sticky-size-start="48"
          :title="t('weighingInformation.man') + t('weighingInformation._')"
        >
          <template #body="props">
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
                <span v-if="col.field === 'requestTime'">
                  {{ moment(col.value).format('HH:m:ss DD/MM/YYYY') }}
                </span>
                <span v-else-if="col.field === 'status'">
                  {{ t(`statusCodes.${col.value}`) }}
                </span>
                <span v-else-if="col.field === 'actualAmount'">
                  {{ (col.value === -1) ? '____' : col.value }}
                </span>
                <span v-else-if="col.field === 'recipeType'">
                  {{ t(`recipeTypes.${col.value}`) }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </q-card-section>

    <!-- <q-card-actions class="self-end">
      <q-btn
        v-close-popup
        class="m-2"
        color="secondary"
        flat
        :label="t('close')"
        style="font-size: medium;"
      />
    </q-card-actions> -->
  </q-card>
</template>

<style scoped>
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
</style>
