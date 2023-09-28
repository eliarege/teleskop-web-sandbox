<script setup lang="ts">
import type { MachineDataRaw } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const route = useRoute()
const currentMachine = computed(() => store.machine.find(machine => machine.id === Number.parseInt(route.params.id as string)) as MachineDataRaw)
</script>

<template>
  <div v-if="currentMachine">
    <MachineVnc :current-machine="currentMachine" />
  </div>
</template>
