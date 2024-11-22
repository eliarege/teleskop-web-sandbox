<script setup lang="ts">
import { useAlarmStore } from '~/store/Alarm'

const alarmStore = useAlarmStore()
const { t } = useI18n()

const machinesWithAlarmCount = computed(() => alarmStore.alarmList.map(e => e.machineId).length)
const confirmedAlarms = computed(() => alarmStore.alarmList.flatMap(m => m.alarmList).filter(a => a.alarmStatus === 1).length)
const nonConfirmedAlarms = computed(() => alarmStore.alarmList.flatMap(m => m.alarmList).filter(a => a.alarmStatus === 0).length)

const breakpoints = useBreakpoints({
  lg: '1200px',
  sm: '768px',
  md: '768px',
})
const sm = breakpoints.greaterOrEqual('sm')
</script>

<template>
  <div class="grid grid-cols-[0.4fr_1fr_0.3fr] w-full" :class="sm ? 'gap-5' : 'gap-1'">
    <div class="flex items-center">
      <span class="flex-center gap-1">
        <TwIcon
          name="i-mdi:clock-outline"
          size="30px"
          color="gray"
        />
        <span v-if="sm">{{ t('alarm.topbar.last-day') }}:</span> {{ alarmStore.alarmStats.alarmsInLast24Hours }}
      </span>
    </div>
    <div class="flex-center" :class="sm ? 'gap-19' : 'gap-1'">
      <span :class="sm ? 'flex-center flex-col' : 'flex-center flex-col text-center'">
        <span class="text-xl font-extrabold text-red-600">
          {{ nonConfirmedAlarms }}
        </span>
        {{ t('alarm.topbar.active-alarms') }}
      </span>
      <span :class="sm ? 'flex-center flex-col' : 'flex-center flex-col text-center'">
        <span class="text-xl font-extrabold text-yellow-500">
          {{ confirmedAlarms }}
        </span>
        {{ t('alarm.topbar.confirmed-alarms') }}
      </span>
      <span :class="sm ? 'flex-center flex-col' : 'flex-center flex-col text-center'">
        <span class="text-xl font-extrabold text-gray-600">
          {{ machinesWithAlarmCount }}
        </span>
        {{ t('alarm.topbar.machine-count') }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
