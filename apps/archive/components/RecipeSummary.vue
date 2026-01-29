<script setup lang="ts">
import { format } from 'date-fns'
import type { BasicProgram, BatchInfo } from '~/types/archive'

defineProps<{
  recipe: any
  jobOrderInfo: BatchInfo
  programs: BasicProgram[]
}>()
const { t } = useNuxtApp().$i18n
</script>

<template>
  <div class="container">
    <div class="section">
      <div>{{ `${t('jobOrder')}: ${jobOrderInfo.jobOrder}` }}</div>
      <div>{{ `${t('machine')}: ${jobOrderInfo.machineId} - ${jobOrderInfo.machineName}` }}</div>
      <div>{{ `${t('kg')}: ` }}</div>
      <div>{{ `${t('flotte')}: ` }}</div>
    </div>
    <div class="section">
      <div> {{ t('programName') }} </div>
      <div v-for="program of programs" :key="`program${program.programNo}`">
        {{ program.programName }}
      </div>
      <div>
        {{ `${t('startTime')}: ${format(jobOrderInfo.startTime, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
        {{ `${t('endTime')}: ${format(jobOrderInfo.endTime!, 'HH:mm:ss dd/MM/yyyy')}` }} <br>
      </div>
    </div>
    <hr>
    <div class="section-title">
      {{ t('recipe') }}
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>{{ t('ISN') }}</th>
          <th>{{ t('materialCode') }}</th>
          <th>{{ t('materialName') }}</th>
          <th>{{ t('actualAmount') }}</th>
          <th>{{ t('recipeAmount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(rc, index) of recipe" :key="`recipeStep${index}`">
          <td>{{ rc.ISN }}</td>
          <td>{{ rc.chemCode }}</td>
          <td>{{ rc.materialName }}</td>
          <td>{{ Number(rc.amount / 1000).toFixed(2) }}</td>
          <td>{{ rc.recipeAmount ? Number(rc.recipeAmount).toFixed(2) : '-' }}</td>
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
