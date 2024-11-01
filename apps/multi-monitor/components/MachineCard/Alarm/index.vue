<script setup lang="ts">
import type { MachineAlarmList } from '~/shared/types'

const { data: alarmList } = await useFetch('/api/alarmList', {
  default: () => [] as MachineAlarmList[],
})

const { t } = useI18n()

const alarmColumns = computed(() => alarmList.value.reduce((a, b, i) => {
  a[i % a.length].push(b)
  return a
}, [[], [], [], []]))
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <div class="space-y-3">
      <MachineCardAlarmView
        v-for="machine in alarmColumns[0]"
        :key="`0${machine.machineId}`"
        :machine
      />
    </div>
    <div class="space-y-3">
      <MachineCardAlarmView
        v-for="machine in alarmColumns[1]"
        :key="`1${machine.machineId}`"
        :machine
      />
    </div>
    <div class="space-y-3">
      <MachineCardAlarmView
        v-for="machine in alarmColumns[2]"
        :key="`2${machine.machineId}`"
        :machine
      />
    </div>
    <div class="space-y-3">
      <MachineCardAlarmView
        v-for="machine in alarmColumns[3]"
        :key="`3${machine.machineId}`"
        :machine
      />
    </div>
  </div>
</template>
