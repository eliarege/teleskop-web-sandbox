<script setup lang="ts">
const selectedMachineId = ref()
const selectedCommandNo = ref()

const waterIO1 = ref()
const waterIO2 = ref()
const waterParam = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines')
const { data: machineCommands } = useLazyFetch('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
})
const { data: waterIO } = useLazyFetch('/api/IO/command-io-all', {
  immediate: false,
  query: { machineId: selectedMachineId, commandNo: selectedCommandNo },
})

const { data: waterParams } = useLazyFetch('/api/commands/command-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId, commandNo: selectedCommandNo },
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleCommandClick(commandNo: number) {
  selectedCommandNo.value = commandNo
}
const filteredWaterIO1Options = computed(() => {
  // Filter waterIO options based on waterIO2 selection
  return (waterIO.value && waterIO2.value)
    ? waterIO.value.filter(io => io.ioIndex !== waterIO2.value.ioIndex)
    : waterIO.value ? waterIO.value : []
})
const filteredWaterIO2Options = computed(() => {
  // Filter waterIO options based on waterIO1 selection
  return (waterIO.value && waterIO1.value)
    ? waterIO.value.filter(io => io.ioIndex !== waterIO1.value.ioIndex)
    : waterIO.value ? waterIO.value : []
})
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

    <q-card-section class="w-xs flex flex-col">
      <div class="flex flex-col">
        <h3>Su Kaynağı - IO</h3>
        <q-select
          v-model="waterIO1"
          :options="filteredWaterIO1Options"
          option-label="name"
          option-value="ioIndex"
        />
        <q-select
          v-model="waterIO2"
          :options="filteredWaterIO2Options"
          option-label="name"
          option-value="ioIndex"
        />
      </div>
      <div class="w-xs flex flex-col">
        <h3>Su Miktarı - Parametre</h3>
        <q-select
          v-model="waterParam"
          :options="waterParams"
          option-label="paramString"
          option-value="parameterIndex"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
