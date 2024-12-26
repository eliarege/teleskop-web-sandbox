<script setup lang="ts">
import { format } from 'date-fns'
import type { BasicProgram, BatchInfo, ERPParameter } from '~/types/archive'

defineProps<{
  consumptions: any
  joborderInfo: BatchInfo
  programs: BasicProgram[]
  consumptionUnits: Array<any>
  erpParameters: Array<ERPParameter>
}>()

const { t } = useNuxtApp().$i18n
</script>

<template>
  <div class="container">
    <div class="header">
      <div> {{ t('collectionNo') }} </div>
      <div> - </div>
    </div>
    <div class="section">
      <div>{{ `${t('joborder')}: ${joborderInfo.joborder}` }}</div>
      <div>{{ `${t('machine')}: ${joborderInfo.machineId} - ${joborderInfo.machineName}` }}</div>
    </div>
    <div class="section">
      <div>{{ t('process') }}</div>
      <div v-for="program of programs" :key="`program${program.programNo}`">
        {{ program.programName }}
      </div>
    </div>
    <div class="section">
      <div>İşlem Grubu: (DYEING)</div>
      <div>
        {{ `${t('startTime')}: ${format(joborderInfo.startTime, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
        {{ `${t('endTime')}: ${format(joborderInfo.endTime!, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
      </div>
    </div>
    <div class="section">
      {{ `${t('theoreticalDuration')}: ${format(joborderInfo.theoreticalDuration, 'HH:mm:ss')}` }} <br>
      {{ `${t('actualDuration')}: ${format(joborderInfo.actualDuration!, 'HH:mm:ss')}` }} <br>
      <div class="highlight-red">
        {{ `${t('deviation')}: ${format(joborderInfo.deviation!, 'HH:mm:ss')}` }}
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
        <tr v-for="(value, key) in consumptions" :key="key">
          <td>{{ t(`joborderSummary.${key}`) }}</td>
          <td>{{ Number(value).toFixed(2) }}</td>
          <td>{{ consumptionUnits[key] }}</td>
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
