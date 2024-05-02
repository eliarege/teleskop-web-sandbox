<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const route = useRoute()
const currentMachine = computed(() => {
  return store.machines.find(machine => machine.id === Number.parseInt(route.params.id as string))
})

useHeadSafe(computed(() => ({
  title: currentMachine.value?.name || 'Loading',
})))
</script>

<template>
  <div v-if="currentMachine" class="text-center pt-4">
    <MachineVnc class="inline" :machine="currentMachine" />
  </div>
</template>
