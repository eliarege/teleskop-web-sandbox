<script setup lang="ts">
import type { Machine } from '~/types'

const machines = ref(await $fetch('/api/machine/machines'))

const selectedMachines: Machine[] = ref([])

function machineSelection(e) {
  if (e.added)
    selectedMachines.value.push(e.rows[0])
  else
    selectedMachines.value = selectedMachines.value.filter((m: Machine) => m.id !== e.rows[0].id)
}

function deleteMachine(machineIds: string[]) {
  machines.value = machines.value.filter((m: Machine) => !machineIds.includes(m.id))
  selectedMachines.value = selectedMachines.value.filter((m: Machine) => !machineIds.includes(m.id))
}

async function addMachine() {
  machines.value = await $fetch('/api/machine/machines')
}
</script>

<template>
  <q-chip outline color="teal">
    Teleskop Basic - Makineler 4.19
  </q-chip>
  <Topbar />
  <Menubar
    :machines="machines"
    :selected-machines="selectedMachines"
    @delete-machine="deleteMachine"
    @add-machine="addMachine"
  />
  <MachinesTable
    :machines="machines"
    :selected-machines="selectedMachines"
    @machine-selection="machineSelection"
  />
</template>

<style scoped>

</style>
