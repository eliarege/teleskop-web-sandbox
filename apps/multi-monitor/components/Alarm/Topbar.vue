<script setup lang="ts">
import { useAlarmStore } from '~/store/Alarm'

const alarmStore = useAlarmStore()
const { t } = useI18n()

const machinesWithAlarmCount = computed(() => alarmStore.alarmList.map(e => e.machineId).length)
const confirmedAlarms = computed(() => alarmStore.alarmList.flatMap(m => m.alarmList).filter(a => a.alarmStatus === 1).length)
const nonConfirmedAlarms = computed(() => alarmStore.alarmList.flatMap(m => m.alarmList).filter(a => a.alarmStatus === 0).length)
</script>

<template>
  <div class="grid grid-cols-[0.4fr_1fr_0.3fr] w-full gap-5">
    <div class="flex items-center">
      <span class="flex-center gap-1">
        <TwIcon
          name="i-mdi:clock-outline"
          size="30px"
          color="gray"
        />
        {{ t('alarm.topbar.last-day') }}: {{ alarmStore.alarmStats.alarmsInLast24Hours }}
      </span>
    </div>
    <div class="flex-center gap-19">
      <span class="flex-center flex-col">
        <span class="text-xl font-extrabold text-red-600">
          {{ nonConfirmedAlarms }}
        </span>
        {{ t('alarm.topbar.active-alarms') }}
      </span>
      <span class="flex-center flex-col">
        <span class="text-xl font-extrabold text-yellow-500">
          {{ confirmedAlarms }}
        </span>
        {{ t('alarm.topbar.confirmed-alarms') }}
      </span>
      <span class="flex-center flex-col">
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
