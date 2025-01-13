<script setup lang="ts">
import { format } from 'date-fns'
import type { BatchInfo } from '~/types/archive'

const props = defineProps<{
  jobOrderInfo: BatchInfo
}>()
const { t } = useI18n()

const keyLabels = computed(() => {
  return {
    machineName: t('joborderTable.machineName'),
    machineModel: t('joborderTable.model'),
    operatorName: t('joborderTable.operator'),
    joborder: t('joborderTable.jobOrder'),
    startTime: t('joborderTable.startTime'),
    endTime: props.jobOrderInfo.isCancelled ? t('joborderTable.cancelTime') : t('joborderTable.endTime'),
    theoreticalEndTime: t('joborderTable.theoreticalEndTime'),
  }
})

const theoreticalEndTime = computed(() => new Date((new Date(props.jobOrderInfo.startTime)).getTime() + props.jobOrderInfo.theoreticalDuration * 1000))
</script>

<template>
  <div class="border wh-full overflow-y-auto text-xs h-full table-container">
    <table class="table w-full">
      <tbody>
        <tr v-for="(value, key) in keyLabels" :key="`joborderInfo${key}`">
          <td class="px-2 py-0.5 text-left">
            {{ value }}
          </td>
          <td class="px-2 py-0.5 text-left">
            <span v-if="key === 'theoreticalEndTime'">
              {{ format(theoreticalEndTime, 'HH:mm:ss dd/MM/yyyy') }}
            </span>
            <span v-else-if="key === 'startTime' || key === 'endTime'">
              {{ jobOrderInfo[key] ? format(jobOrderInfo[key], 'HH:mm:ss dd/MM/yyyy') : '-' }}
            </span>
            <span v-else>
              {{ jobOrderInfo[key] }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="postcss">
.table {
  width: 100%;
}

.table td {
  text-align: left;
  font-size: inherit;
  border-bottom: 1px solid theme('colors.gray.400');
}

.table-container {
  max-height: 100%;
  overflow-y: auto;
  font-size: inherit;
}
</style>
