<script setup lang="ts">
import type { MachineDataRaw } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const route = useRoute()
const currentMachine = computed(() => {
  return store.machine.find(machine => machine.id === Number.parseInt(route.params.id as string))
})

useHeadSafe(computed(() => ({
  title: currentMachine.value?.name || 'Unknown machine',
})))
</script>

<template>
  <div v-if="currentMachine">
    <MachineVnc :current-machine="currentMachine" />
  </div>
</template>
