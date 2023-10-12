<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps({
  joborder: Number,
  machinename: String,
})
const { t } = useI18n()

const columnsOto = [
  { name: 'processNo', label: t('recipe.processNo'), field: '' },
  { name: 'machinename', label: t('machinename'), field: '' },
  { name: 'tankNo', label: t('tankNo'), field: '' },
  { name: 'processIndex', label: t('recipe.processOrder'), field: '' },
  { name: 'mainStep', label: t('weighingInformation.mainStep'), field: '' },
  { name: 'parallelStep', label: t('weighingInformation.parallelStep'), field: '' },
  { name: 'materialCode', label: t('materialCode'), field: '' },
  { name: 'materialName', label: t('materialName'), field: '' },
  { name: 'recipeAmount', label: t('recipeAmount'), field: '' },
  { name: 'actualAmount', label: t('actualAmount'), field: '' },
  { name: 'status', label: t('statusCodes.text'), field: '' },
  { name: 'requestTime', label: t('requestTime'), field: '' },
  { name: 'completedTime', label: t('weighingInformation.completionTime'), field: '' },
  { name: 'interval', label: t('weighingInformation.passingTime'), field: '' },
  { name: 'otoMan', label: t('weighingInformation.otoMan'), field: '' },
]

const columnsMan = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo' },
  { name: 'weighingNumber', label: t('weighingInformation.weighingNumber'), field: 'weighingNumber' },
  { name: 'recipeType', label: t('recipeType'), field: 'recipeType' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'materialName', label: t('materialName'), field: '' },
  { name: 'actualAmount', label: t('actualAmount'), field: '' },
  { name: 'status', label: t('statusCodes.text'), field: '' },
  { name: 'requestTime', label: t('requestTime'), field: '' },
]
</script>

<template>
  <q-card class="column">
    <div class="text-h6 ml-7 mt-3">
      {{ t('jobOrderLogs.a') }} -
      <span v-if="joborder">
        {{ t('joborder') }} : {{ joborder }} -
      </span>
      <span v-if="props.machinename">
        {{ t('machinename') }} : {{ props.machinename }}
      </span>
    </div>
    <q-card-section class="text-override-left">
      <div class="m-5">
        <q-table
          :columns="columnsOto"
          virtual-scroll
          flat
          bordered
          :virtual-scroll-sticky-size-start="48"
          :title="t('weighingInformation.oto') + t('weighingInformation.a')"
        />
      </div>
      <div class="m-5">
        <q-table
          :columns="columnsMan"
          virtual-scroll
          flat
          bordered
          :virtual-scroll-sticky-size-start="48"
          :title="t('weighingInformation.man') + t('weighingInformation.a')"
        />
      </div>
    </q-card-section>

    <q-card-actions
      style="position:absolute; bottom: 0; right: 0;"
    >
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
