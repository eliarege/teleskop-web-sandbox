<script setup lang="ts">
const selectedMachineId = ref()

const counter1 = ref()
const counter2 = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: counterOptions } = useLazyFetch('/api/consumption-counters/mach-counters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (counterOptions) => {
    counterOptions.unshift({
      id: -1,
      name: 'Seçilmedi',
    })
    return counterOptions
  },
})

const { data: counters } = useLazyFetch('/api/consumption-counters/consumption-counters', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

watch(counters, (newValue, oldValue) => {
  counter1.value = counterOptions.value.find(option => option.id === counters.value.counter1)?.name || ''
  counter2.value = counterOptions.value.find(option => option.id === counters.value.counter2)?.name || ''
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
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
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="flex flex-col input-field">
      <q-select
        v-model="counter1"
        :options="counterOptions"
        option-label="name"
        option-value="id"
        label="Sayaç 1"
      />
      <q-select
        v-model="counter2"
        :options="counterOptions"
        option-label="name"
        option-value="id"
        label="Sayaç 2"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.input-field>* {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
