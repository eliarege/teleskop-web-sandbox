<script setup lang="ts">
import Alarm from '~/pages/alarm.vue'
import type { MachineAlarmList } from '~/shared/types'

defineProps<{ machine: MachineAlarmList }>()
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
        v-show="alarm.showOnScreen"
        :key="alarm.alarmNo"
        class="w-full h-full border-1 border-l-3 rounded px-3 py-2 mb-3"
        :class="alarm.alarmStatus === 0 ? 'border-red-600 bg-red-300/20' : 'border-yellow-500 bg-yellow-300/20'"
      >
        <div class="flex items-center gap-3">
          <Icon
            :name="alarm.alarmStatus === 0 ? 'mingcute:alert-fill' : 'fluent:alert-12-filled'"
            :color="alarm.alarmStatus === 0 ? 'red' : 'orange'"
            size="30"
          />
          <span class="font-extrabold text-xl">{{ alarm.commandNo }} - {{ alarm.alarmNo }} - {{ alarm.alarmName }}
            <QTooltip>
              Command No - Alarm No - Alarm Name
            </QTooltip>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
