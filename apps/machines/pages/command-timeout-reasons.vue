<script setup lang="ts">
import { getMachineCommands, getTimeoutReasons } from '~/utils'

const { data: machines, pending, refresh } = await useFetch('/api/command-timeout-reasons/command-map-machines')

const selectedMachineId = ref()
const machineCommands = ref()
const timeoutReasons = ref()

async function handleMachineClick(machineId: number) {
  machineCommands.value = await getMachineCommands(machineId)
  selectedMachineId.value = machineId
}

async function handleCommandClick(commandNo: number) {
  const selectedTimeoutReasons = await getSelectedTimeoutReasons(selectedMachineId.value, commandNo)
  const allTimeoutReasons = await getTimeoutReasons()
  timeoutReasons.value = allTimeoutReasons.map(r => ({
    ...r,
    checked: selectedTimeoutReasons.some(selectedReason => selectedReason.id === r.id),
  }))
}
</script>

<template>
  <div class="flex flex-row justify-around">
    <div class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div class="w-sm">
      <h3>Komutlar</h3>
      <q-list bordered separator>
        <q-item
          v-for="command in machineCommands"
          :key="command.commandNo"
          v-ripple
          clickable
          @click="handleCommandClick(command.commandNo)"
        >
          <q-item-section>
            {{ command.commandName }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div class="w-sm">
      <h3>Sebepler</h3>
      <q-list bordered separator>
        <q-item
          v-for="reason in timeoutReasons"
          :key="reason.id"
          v-ripple
          clickable
        >
          <q-checkbox v-model:model-value="reason.checked" />
          <q-item-section>
            {{ reason.reasonText }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<style scoped>

</style>
