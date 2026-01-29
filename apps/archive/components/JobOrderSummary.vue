<script setup lang="ts">
import { format } from 'date-fns'
import type { BasicProgram, BatchInfo, ConsumptionKey, ConsumptionUnits, Consumptions, ERPParameter } from '~/types/archive'

const props = defineProps<{
  consumptions: Consumptions
  jobOrderInfo: BatchInfo
  programs: BasicProgram[]
  consumptionUnits: ConsumptionUnits
  erpParameters: ERPParameter[]
  waterTypes: Record<string, string | null>
}>()

const { t } = useNuxtApp().$i18n

const WATER_KEY_RE = /^waterType\d$/

function isWaterKey(key: string): boolean {
  return WATER_KEY_RE.test(key)
}

const consumptionRows = computed(() => {
  return Object.entries(props.consumptions).map(([key, value]) => {
    let name = ''
    if (isWaterKey(key) && props.waterTypes[key]) {
      name = props.waterTypes[key]!
    } else if (!isWaterKey(key)) {
      name = t(`jobOrderSummary.${key}`)
    }
    return {
      name,
      amount: Number(value).toFixed(2),
      unit: props.consumptionUnits[key as ConsumptionKey],
    }
  }).filter(row => row.name !== '')
})
</script>

<template>
  <div class="container">
    <div class="header">
      <div> {{ t('collectionNo') }} </div>
      <div> - </div>
    </div>
    <div class="section">
      <div>{{ `${t('jobOrder')}: ${jobOrderInfo.jobOrder}` }}</div>
      <div>{{ `${t('machine')}: ${jobOrderInfo.machineId} - ${jobOrderInfo.machineName}` }}</div>
    </div>
    <div class="section">
      <div>{{ t('process') }}</div>
      <div v-for="program of programs" :key="`program${program.programNo}`">
        {{ program.programName }}
      </div>
    </div>
    <div class="section">
      <div>{{ t('processGroup') }} (DYEING)</div>
      <div>
        {{ `${t('startTime')}: ${format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
        {{ `${t('endTime')}: ${format(jobOrderInfo.endTime!, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
      </div>
    </div>
    <div class="section">
      {{ `${t('theoreticalDuration')}: ${format(jobOrderInfo.theoreticalDuration, 'HH:mm:ss')}` }} <br>
      {{ `${t('actualDuration')}: ${format(jobOrderInfo.actualDuration!, 'HH:mm:ss')}` }} <br>
      <div class="highlight-red">
        {{ `${t('deviation')}: ${format(jobOrderInfo.deviation!, 'HH:mm:ss')}` }}
      </div>
    </div>
    <hr>
    <div class="section-title">
      {{ t('consumptions') }}
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>{{ t('consumptions') }}</th>
          <th>{{ t('amount') }}</th>
          <th>{{ t('unit') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(value, key) in consumptionRows" :key="key">
          <td>{{ value.name }}</td>
          <td>{{ value.amount }}</td>
          <td>{{ value.unit }}</td>
        </tr>
      </tbody>
    </table>
    <div class="section-title">
      {{ t('startingParameters') }}
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>{{ t('parameter') }}</th>
          <th>{{ t('amount') }}</th>
          <th>{{ t('unit') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="param in erpParameters" :key="`erp-param-${param.parameterId}`">
          <td>{{ param.parameterName }}</td>
          <td>{{ Number(param.value).toFixed(2) }}</td>
          <td>{{ param?.unit }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
body {
  font-family: Arial, sans-serif;
}
.container {
  width: 90%;
  margin: 20px auto;
}
.header,
.section {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}
.section-title {
  font-weight: bold;
  border-bottom: 1px solid black;
  padding-bottom: 5px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.table th,
.table td {
  border: 1px solid black;
  padding: 8px;
  text-align: left;
}
.highlight-red {
  color: red;
}
</style>
