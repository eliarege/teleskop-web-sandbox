<script setup lang="ts">
import { getMachineCommands } from '~/utils'

const { data: machines } = await useFetch('/api/command-timeout-reasons/command-map-machines')

const selectedMachineId = ref()
const machineCommands = ref()

async function handleMachineClick(machineId: number) {
  machineCommands.value = await getMachineCommands(machineId)
  selectedMachineId.value = machineId
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
        >
          <q-item-section>
            {{ command.commandName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="flex flex-col">
      <div class="flex flex-col">
        <h3>Su Kaynağı - IO</h3>
        <q-select />
        <q-select />
      </div>
      <div class="flex flex-col">
        <h3>Su Miktarı - Parametre</h3>
        <q-select />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
