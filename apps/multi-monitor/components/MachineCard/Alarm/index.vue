<script setup lang="ts">
import { times } from 'lodash-es'
import type { MachineAlarmList } from '~/shared/types'
import { useAlarmStore } from '~/store/Alarm'

const alarmStore = useAlarmStore()

const { start: scheduleNext } = useTimeoutFn(async () => {
  await alarmStore.fetchAlarmList()
  scheduleNext()
}, 5000)

const columnsLength = ref(4)

const alarmColumns = computed(() => {
  return alarmStore.alarmList.reduce((a, b, i) => {
    a[i % a.length].push(b)
    return a
  }, [...times(columnsLength.value, () => [] as MachineAlarmList[])])
})
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <div
      v-for="(column, index) in alarmColumns"
      :key="index"
      class="space-y-3"
    >
      <MachineCardAlarmView
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
  grid-template-columns: repeat(v-bind(columnsLength), 1fr);
  @apply gap-3;
}
</style>
