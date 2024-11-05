<script setup lang="ts">
const { data: alarms } = await useFetch('/api/alarms', {
  default: () => [],
})
const machines = computed(() => alarms.value.map(m => ({ name: m.machineName, id: m.machineId })))
const activeMachine = ref(3)
const commands = computed(() => alarms.value.filter(c => c.machineId === activeMachine.value).map(a => a.commands).flat())
</script>

<template>
  <div class="topbar-height grid grid-cols-[280px_1fr]">
    <AlarmSidebar v-model="activeMachine" :machines />
    <AlarmCard
      :commands
      :active-machine
    />
  </div>
</template>

<style scoped lang="postcss">
.topbar-height {
  height: calc(100vh - 65px);
}
</style>
