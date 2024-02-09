<script setup lang="ts">
import { cellRGBColorHandler } from '../shared/functions'
import { colors } from '~/shared/constants'

const props = defineProps({
  joborder: String,
  machinename: String,
  correctionNo: Number,
})
const { t, d } = useI18n()

const columnsOto = [
  { name: 'processNo', label: t('recipe.processNo'), field: 'processNo' },
  { name: 'machinename', label: t('machinename'), field: 'machinename' },
  { name: 'tankNo', label: t('tankNo'), field: 'tankNo', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'processIndex', label: t('recipe.processOrder'), field: 'processIndex' },
  { name: 'mainStep', label: t('weighingInformation.mainStep'), field: 'mainStep' },
  { name: 'parallelStep', label: t('weighingInformation.parallelStep'), field: 'parallelStep' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'recipeAmount', label: t('recipeAmount'), field: 'recipeAmount' },
  { name: 'actualAmount', label: t('actualAmount'), field: 'actualAmount', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'status', label: t('statusCodes.text'), field: 'status', format: (val, row) => t(`statusCodes.${val}`), style: row => cellRGBColorHandler(row.status) },
  {
    name: 'requestTime',
    label: t('requestTime'),
    field: 'requestTime',
    format: (val, row) => {
      return val ? d(val, 'datetime') : '_'.repeat(4)
    },
  },
  {
    name: 'completedTime',
    label: t('weighingInformation.completionTime'),
    field: 'completedTime',
    format: (val, row) => {
      return val ? d(val, 'datetime') : '_'.repeat(4)
    },
  },
  {
    name: 'interval',
    label: t('weighingInformation.passingTime'),
    field: 'interval',
    format: (val, row) => {
      return !val ? '____' : `${Math.floor(val / 60)} ${t('hour')} ${val % 60} ${t('min')}`
    },
  },
  { name: 'otoMan', label: t('weighingInformation.otoMan'), field: 'otoMan', format: (val, row) => val ? t('weighingInformation.oto') : t('weighingInformation.man') },
]

const columnsMan = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo' },
  { name: 'weighingNumber', label: t('weighingInformation.weighingNumber'), field: 'weighingNumber' },
  { name: 'recipeType', label: t('recipeType'), field: 'recipeType', format: (val, row) => t(`recipeTypes.${val}`) },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'actualAmount', label: t('recipeAmount'), field: 'actualAmount', format: (val, row) => (val === -1) ? '____' : val },
  { name: 'status', label: t('statusCodes.text'), field: 'status', format: (val, row) => t(`statusCodes.${val}`), style: row => cellRGBColorHandler(row.status) },
  {
    name: 'requestTime',
    label: t('requestTime'),
    field: 'requestTime',
    format: (val, row) => {
      return d(val, 'datetime')
    },
  },
]
const data = await $fetch(`/api/consumption/theoretical?joborder=${props.joborder}&correctionNo=${props.correctionNo}`)
const data2 = await $fetch(`/api/consumption/manual?joborder=${props.joborder}&correctionNo=${props.correctionNo}`)
</script>

<template>
  <q-card class="row">
    <q-card-section>
      <div class="text-h6 ml-7 mt-3">
        {{ t('weighingInformation._') }} -
        <span v-if="joborder">
          {{ t('joborder') }} : {{ joborder }} -
        </span>
        <span v-if="props.machinename">
          {{ t('machinename') }} : {{ props.machinename }}
        </span>
      </div>
    </q-card-section>

    <q-card-section class="row gap-5" style="display: flex;">
      <q-table
        :columns="columnsOto"
        :rows="data"
        virtual-scroll
        flat
        class="w-full"
        bordered
        :virtual-scroll-sticky-size-start="48"
        :title="t('weighingInformation.oto') + t('weighingInformation._')"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="text-override-left"
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
      </q-table>
      <q-table
        :columns="columnsMan"
        :rows="data2"
        virtual-scroll
        class="w-full"
        flat
        bordered
        :virtual-scroll-sticky-size-start="48"
        :title="t('weighingInformation.man') + t('weighingInformation._')"
      >
        <template #body="props">
          <q-tr
            :props="props"
            class="text-override-left"
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
      </q-table>
    </q-card-section>
    <q-card-actions class="w-full">
      <q-space />
      <q-btn
        v-close-popup
        class="m-2"
        color="secondary"
        flat
        :label="t('close')"
        style="font-size: medium;"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
</style>
