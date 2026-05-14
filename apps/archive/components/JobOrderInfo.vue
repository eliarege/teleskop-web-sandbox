<script setup lang="ts">
import type { BatchInfo } from '~/types/archive'
import { formatDuration } from '~/utils/functions'

const props = defineProps<{
  jobOrderInfo?: BatchInfo
}>()

const { t, d } = useI18n()

const theoreticalEndTime = computed(() => {
  const job = props.jobOrderInfo
  if (!job?.startTime || !job?.theoreticalDuration)
    return null

  return new Date(new Date(job.startTime).getTime() + job.theoreticalDuration * 1000)
})

const timeStatus = computed(() => {
  const job = props.jobOrderInfo
  if (!job?.theoreticalDuration)
    return null

  if (job.endTime && job.deviation !== null && job.deviation !== undefined) {
    if (job.deviation < 0)
      return { status: 'early' as const, color: 'positive' as const, deviation: job.deviation }
    if (job.deviation === 0)
      return { status: 'onTime' as const, color: 'info' as const, deviation: 0 }
    return { status: 'late' as const, color: 'negative' as const, deviation: job.deviation }
  }

  if (!job.endTime && !job.isCancelled && job.startTime) {
    const elapsed = Math.floor((Date.now() - new Date(job.startTime).getTime()) / 1000)
    const diff = elapsed - job.theoreticalDuration
    if (diff > 0)
      return { status: 'late' as const, color: 'negative' as const, deviation: diff }
    return { status: 'onTime' as const, color: 'positive' as const, deviation: null }
  }
  return null
})

const infoRows = computed(() => {
  const job = props.jobOrderInfo

  return [
    { label: t('jobOrderTable.machineName'), value: job?.machineName },
    { label: t('jobOrderTable.model'), value: job?.machineModel },
    { label: t('jobOrderTable.operator'), value: job?.operatorName },
    { label: t('jobOrderTable.jobOrder'), value: job?.jobOrder },
    {
      label: t('jobOrderTable.startTime'),
      value: job?.startTime ? d(job?.startTime, 'datetime'): ''
    },
    {
      label: job?.isCancelled ? t('jobOrderTable.cancelTime') : t('jobOrderTable.endTime'),
      value: job?.endTime ? d(job?.endTime, 'datetime') : '',
    },
    {
      label: t('jobOrderTable.theoreticalEndTime'),
      value: theoreticalEndTime.value ? d(theoreticalEndTime.value, 'datetime') : '',
      badge: timeStatus.value?.deviation !== null && timeStatus.value?.deviation !== undefined
        ? { color: timeStatus.value.color, label: formatDuration(timeStatus.value.deviation) }
        : null,
    },
  ]
})
</script>

<template>
  <q-list
    class="wh-full overflow-y-auto bg-white py-2"
    dense
    separator
  >
    <q-item
      v-for="(item, index) in infoRows"
      :key="index"
    >
      <q-item-section>
        <span>
          {{ item.label }}
        </span>
      </q-item-section>

      <q-item-section side>
        <div class="flex items-center gap-2">
          <q-badge
            v-if="item.badge"
            :color="item.badge.color"
            :label="item.badge.label"
          />
          <span>{{ item.value ?? '-' }}</span>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>
