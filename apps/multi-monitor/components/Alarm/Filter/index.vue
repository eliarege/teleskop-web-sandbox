<script setup lang="ts">
import type { MachineAlarm } from '~/shared/types'

const emit = defineEmits(['close'])
const { data: alarms } = await useFetch<MachineAlarm[]>('/api/alarms', {
  default: () => [],
})

const machines = computed(() =>
  alarms.value.map(m => ({ name: m.machineName, id: m.machineId })),
)

const activeMachine = ref(machines.value[0]?.id)

const commands = computed(() => {
  return alarms.value
    .filter(c => c.machineId === activeMachine.value)
    .flatMap(a => a.commands)
})
</script>

<template>
  <div class="alarm-container-height grid grid-cols-[280px_1fr] bg-white">
    <AlarmFilterSidebar
      v-model="activeMachine"
      :machines
    />
    <AlarmFilterCard
      :commands
      :active-machine
      class="overflow-auto"
      @close="emit('close')"
    />
  </div>
</template>

<style lang="postcss">
.alarm-container-height {
  height: calc(100vh - 65px);
}
</style>
