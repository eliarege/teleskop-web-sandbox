<script setup lang="ts">
import { addTimeoutReason, deleteTimeoutReason, getMachineCommands, getTimeoutReasons } from '~/utils'

const { data: machines, pending, refresh } = await useFetch('/api/machines/active-machines')

const selectedMachineId = ref()
const selectedCommandNo = ref()
const machineCommands = ref()
const timeoutReasons = ref()

async function handleMachineClick(machineId: number) {
  const { data } = await useFetch('/api/master-commands/master-commands', { query: { machineId } })
  machineCommands.value = data.value
  selectedMachineId.value = machineId
}

async function handleCommandClick(commandNo: number) {
  const { data: selectedTimeoutReasons } = await useFetch('/api/command-timeout-reasons/selected-timeout-reasons', { query: { machineId: selectedMachineId.value, commandNo } })
  const { data: allTimeoutReasons } = await useFetch('/api/command-timeout-reasons/timeout-reasons')
  timeoutReasons.value = allTimeoutReasons.value.map(r => ({
    ...r,
    checked: selectedTimeoutReasons.value.some(selectedReason => selectedReason.id === r.id),
  }))
  selectedCommandNo.value = commandNo
}

async function handleCheckChange(e, reason) {
  reason.machineId = selectedMachineId.value
  reason.commandNo = selectedCommandNo.value
  console.log('e, reason = ', e, reason)
  if (e)
    await addTimeoutReason(reason)
  else if (!e)
    await deleteTimeoutReason(reason)
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
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
    </q-card-section>

    <q-card-section class="w-sm">
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
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>Sebepler</h3>
      <q-list bordered separator>
        <q-item
          v-for="reason in timeoutReasons"
          :key="reason.id"
          v-ripple
          clickable
        >
          <q-checkbox v-model:model-value="reason.checked" @update:model-value="(e) => handleCheckChange(e, reason)" />
          <q-item-section>
            {{ reason.reasonText }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
