<script setup lang="ts">
import { times } from 'lodash-es'
import { useBreakpoints } from '@vueuse/core'
import type { MachineAlarmList } from '~/shared/types'
import { useAlarmStore } from '~/store/Alarm'

const alarmStore = useAlarmStore()

const { start: scheduleNext } = useTimeoutFn(async () => {
  await alarmStore.fetchAlarmList()
  scheduleNext()
}, 5000)

const breakpoints = useBreakpoints({
  sm: 900,
  md: 1350,
  lg: 1800,
  xl: 2150,
})
const sm = breakpoints.smallerOrEqual('sm')
const md = breakpoints.smallerOrEqual('md')
const lg = breakpoints.smallerOrEqual('lg')

const columnsLength = computed(() => {
  if (sm.value)
    return 1
  if (md.value)
    return 2
  if (lg.value)
    return 3
  return 4
})

const alarmColumns = computed(() => {
  return alarmStore.alarmList.reduce((a, b, i) => {
    a[i % a.length].push(b)
    return a
  }, [...times(columnsLength.value, () => [] as MachineAlarmList[])])
})
</script>

<template>
  <div class="grid gap-3 px-1" :style="{ gridTemplateColumns: `repeat(${columnsLength}, 1fr)` }">
    <div
      v-for="(column, index) in alarmColumns"
      :key="index"
      class="space-y-3 min-w-390px"
    >
      <AlarmView
        v-for="machine in column"
        :key="`${index}-${machine.machineId}`"
        :machine
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.alarm-columns {
  display: grid;
  @apply gap-3;
}
</style>
