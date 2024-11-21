<script setup lang="ts">
import { differenceInMilliseconds } from 'date-fns'
import Alarm from '~/pages/alarm.vue'
import type { MachineAlarmList } from '~/shared/types'

defineProps<{ machine: MachineAlarmList }>()
const { d, t } = useI18n()

function getTimeDifferenceInMinutesSeconds(alarmStartTime: string): string {
  const differenceInMilliseconds = new Date().getTime() - new Date(alarmStartTime).getTime()
  const minutes = Math.floor(differenceInMilliseconds / 60000)
  const seconds = Math.floor((differenceInMilliseconds % 60000) / 1000)

  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
}
</script>

<template>
  <div class="border-1 border-gray-500/40 rounded-2xl shadow-md w-full h-min bg-gray-100">
    <div class="flex items-center justify-between px-3">
      <span class="font-extrabold text-xl ml-5">{{ machine.machineName }}</span>
      <span class="text-gray-700 font-bold">{{ machine.operatorName }}</span>
    </div>
    <div class="px-7 py-2">
      <div
        v-for="alarm in machine.alarmList"
        v-show="alarm.showOnScreen !== false"
        :key="alarm.alarmNo"
        class="w-full h-full border-1 border-l-3 rounded px-3 py-2 mb-3"
        :class="alarm.alarmStatus === 0 ? 'border-red-600 bg-red-300/20' : 'border-yellow-500 bg-yellow-300/20'"
      >
        <div class="flex items-center gap-3 whitespace-nowrap flex-1">
          <TwIcon
            :name="alarm.alarmStatus === 0 ? 'i-mingcute:alert-fill' : 'i-fluent:alert-12-filled'"
            :color="alarm.alarmStatus === 0 ? 'red' : 'orange'"
            size="30px"
          />
          <span class="font-extrabold text-xl">
            {{ alarm.commandNo }} - {{ alarm.alarmNo }} - {{ alarm.alarmName }}
          </span>
        </div>
        <div class="flex flex-col">
          <span class="ml-13">
            {{ t('alarm.start') }}: {{ d(alarm.alarmStartTime, {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }) }}
          </span>
          <span class="ml-13">
            {{ t('alarm.active-since') }}: {{ getTimeDifferenceInMinutesSeconds(alarm.alarmStartTime) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
