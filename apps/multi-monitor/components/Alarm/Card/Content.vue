<script setup lang="ts">
import type { Alarm } from '~/shared/types'

const props = defineProps<{ alarms: Alarm[], activeMachine: number, commandNo: number }>()

async function updateAlarmVisibility(alarmNo: number) {
  await $fetch('/api/alarms', {
    method: 'PUT',
    body: { machineId: props.activeMachine, commandNo: props.commandNo, alarmNo },
  })
}
</script>

<template>
  <div
    v-for="alarm in alarms"
    :key="alarm.alarmNo"
    class="mx-3 my-1"
  >
    <div class="border-1 px-3 rounded bg-gray-100 w-full flex justify-between items-center">
      <span class="font-bold">{{ alarm.alarmNo }} {{ alarm.alarmName }}</span> <q-toggle v-model="alarm.showOnScreen" @update:model-value="(v, e) => updateAlarmVisibility(alarm.alarmNo)" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
