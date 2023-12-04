<script setup lang="ts">
const selectedMachineId = ref()

const fabricWeight = ref()
const flotteRatio = ref()
const partCount = ref()
const partyNo = ref()
const accompanyNo = ref()
const clothLength = ref()
const customer = ref()
const customerOrder = ref()
const fabricType = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: parameters } = useLazyFetch('/api/starting-parameter-types/starting-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const { data: parameterTypes } = useLazyFetch('/api/starting-parameter-types/starting-parameter-types', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameterTypes) => {
    return parameterTypes.map(t => ({
      ...t,
    }))
  },

})

watch(parameterTypes, (newValue, oldValue) => {
  const paramTypeMapping = {
    0: fabricWeight,
    1: flotteRatio,
    2: partCount,
    3: partyNo,
    4: accompanyNo,
    5: clothLength,
    6: customer,
    7: customerOrder,
    8: fabricType,
  }

  for (const [paramTypeId, variable] of Object.entries(paramTypeMapping)) {
    variable.value = parameterTypes.value.find(t => t.paramTypeId === Number(paramTypeId))?.paramString || 'seçilmedi'
  }
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
        v-model="fabricWeight"
        :options="parameters"
        option-label="paramString"
        option-value="paramId"
        label="Mal (Kumaş) Miktarı - Kilo"
      />
      <q-select
        v-model="flotteRatio"
        label="AK Flotte Oranı Parametresi"
      />
      <q-select
        v-model="partCount"
        label="Parça Sayısı"
      />
      <q-select
        v-model="partyNo"
        label="Parti Numarası"
      />
      <q-select
        v-model="accompanyNo"
        label="Refakat Numarası"
      />
      <q-select
        v-model="clothLength"
        label="Kumaş Uzunluğu"
      />
      <q-select

        v-model="customer"
        label="Müşteri"
      />
      <q-select

        v-model="customerOrder"
        label="Sipariş Numarası"
      />
      <q-select

        v-model="fabricType"
        label="Kumaş Tipi"
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
