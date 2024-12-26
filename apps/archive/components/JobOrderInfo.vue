<script setup lang="ts">
import { format } from 'date-fns'
import type { BatchInfo } from '~/types/archive'

const props = defineProps<{
  jobOrderInfo: BatchInfo
}>()
const { t } = useI18n()
const outerDivRef = ref<HTMLElement | null>(null)

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

onMounted(() => {
  if (outerDivRef.value) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        const newFontSize = `${Math.max(12, width / 50)}px`
        if (outerDivRef.value) {
          outerDivRef.value.style.fontSize = newFontSize
        }
      }
    })
    observer.observe(outerDivRef.value)

    onUnmounted(() => {
      if (outerDivRef.value) {
        observer.unobserve(outerDivRef.value)
      }
    })
  }
})

const theoreticalEndTime = computed(() => new Date((new Date(props.jobOrderInfo.startTime)).getTime() + props.jobOrderInfo.theoreticalDuration * 1000))
</script>

<template>
  <div ref="outerDivRef" class="border wh-full overflow-y-auto h-full table-container">
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

<style scoped>
.table {
  width: 100%;
}

.table td {
  text-align: left;
  font-size: inherit;
  border-bottom: 1px solid grey;
}

.table-container {
  max-height: 100%;
  overflow-y: auto;
  font-size: inherit;
}
</style>
