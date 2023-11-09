<script setup lang="ts">
import type { Machine } from '~/types'
import { getMachines } from '~/utils'

const { data: machines, pending, refresh } = useLazyFetch('/api/machines/machines', { default: () => [] })

const selectedMachines = ref<Machine[]>([])

function machineSelection(e) {
  if (e.added)
    selectedMachines.value.push(e.rows[0])
  else
    selectedMachines.value = selectedMachines.value.filter((m: Machine) => m.id !== e.rows[0].id)
}
</script>

<template>
  <Menubar
    :machines="machines"
    :selected-machines="selectedMachines"
    @delete-machine="refresh"
    @add-machine="refresh"
  />
  <MachinesTable
    :machines="machines"
    :pending="pending"
    :selected-machines="selectedMachines"
    @machine-selection="machineSelection"
  />
</template>

<style scoped>

</style>
