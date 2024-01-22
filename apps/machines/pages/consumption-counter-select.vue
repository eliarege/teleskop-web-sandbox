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

const { data: counters } = useLazyFetch('/api/consumption-counters/consumption-counter', {
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

async function handleOptionChange() {
  await selectConsumptionCounter(selectedMachineId.value, counter1.value.id, counter2.value.id)
}
</script>

<template>
  <q-card class="flex flex-row justify-center">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list
        bordered
        separator
        class="overflow-y-auto h-140"
      >
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineCode }}
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
        @update:model-value="handleOptionChange()"
      />
      <q-select
        v-model="counter2"
        :options="counterOptions"
        option-label="name"
        option-value="id"
        label="Sayaç 2"
        @update:model-value="handleOptionChange()"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.input-field > * {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
