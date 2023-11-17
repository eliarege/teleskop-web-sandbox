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
  <q-card class="flex flex-row justify-center">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="flex flex-col">
      <q-select label="Mal (Kumaş) Miktarı - Kilo" />
      <q-select label="AK Flotte Oranı Parametresi" />
      <q-select label="Parça Sayısı" />
      <q-select label="Parti Numarası" />
      <q-select label="Refakat Numarası" />
      <q-select label="Kumaş Uzunluğu" />
      <q-select label="Müşteri" />
      <q-select label="Sipariş Numarası" />
      <q-select label="Kumaş Tipi" />
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
