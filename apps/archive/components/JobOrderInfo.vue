<script setup lang="ts">
import { format } from 'date-fns'
import type { BatchInfo } from '~/types/archive'

const props = defineProps<{
  jobOrderInfo?: BatchInfo
}>()
const { t } = useI18n()

const keyLabels = computed(() => {
  const job = props.jobOrderInfo

  return {
    machineName: t('jobOrderTable.machineName'),
    machineModel: t('jobOrderTable.model'),
    operatorName: t('jobOrderTable.operator'),
    jobOrder: t('jobOrderTable.jobOrder'),
    startTime: t('jobOrderTable.startTime'),
    endTime: job?.isCancelled
      ? t('jobOrderTable.cancelTime')
      : t('jobOrderTable.endTime'),
    theoreticalEndTime: t('jobOrderTable.theoreticalEndTime'),
  }
})

const theoreticalEndTime = computed(() => {
  const job = props.jobOrderInfo
  if (!job?.startTime || !job?.theoreticalDuration)
    return null

  return new Date(
    new Date(job.startTime).getTime()
      + job.theoreticalDuration * 1000,
  )
})
</script>

<template>
  <div class="border wh-full overflow-y-auto text-xs h-full table-container">
    <table class="table w-full">
      <tbody>
        <tr v-for="(value, key) in keyLabels" :key="`jobOrderInfo${key}`">
          <td class="px-2 py-0.5 text-left">
            {{ value }}
          </td>
          <td class="px-2 py-0.5 text-left">
            <span v-if="key === 'theoreticalEndTime' && theoreticalEndTime">
              {{ format(theoreticalEndTime, 'HH:mm:ss dd/MM/yyyy') }}
            </span>
            <span v-else-if="key === 'startTime' || key === 'endTime'">
              {{ props.jobOrderInfo?.[key] ? format(props.jobOrderInfo[key], 'HH:mm:ss dd/MM/yyyy') : '-' }}
            </span>
            <span v-else>
              {{ props.jobOrderInfo?.[key] }}
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
