<script setup lang="ts">
import { selectStartingParameterType } from '~/utils'

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

const paramTypeMaps = reactive([
  { id: 0, name: 'fabricWeight', data: fabricWeight },
  { id: 1, name: 'flotteRatio', data: flotteRatio },
  { id: 2, name: 'partCount', data: partCount },
  { id: 3, name: 'partyNo', data: partyNo },
  { id: 4, name: 'accompanyNo', data: accompanyNo },
  { id: 5, name: 'clothLength', data: clothLength },
  { id: 6, name: 'customer', data: customer },
  { id: 7, name: 'customerOrder', data: customerOrder },
  { id: 8, name: 'fabricType', data: fabricType },
])

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: parameterOptions } = useLazyFetch('/api/starting-parameter-types/starting-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameterOptions) => {
    parameterOptions.unshift({
      paramId: -1,
      paramString: 'Seçilmedi',
    })
    return parameterOptions
  },
})

const { data: parameterTypes } = useLazyFetch('/api/starting-parameter-types/starting-parameter-types', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameterTypes) => {
    return parameterTypes.map(t => ({
      ...t,
      paramName: t.paramId === -1 ? 'Seçilmedi' : t.paramString,
    }))
  },

})

watch(parameterTypes, (_newValue, _oldValue) => {
  for (const paramTypeMap of paramTypeMaps) {
    paramTypeMap.data = parameterTypes.value.find(t => t.paramTypeId === Number(paramTypeMap.id))?.paramString || 'Seçilmedi'
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleOptionChange(paramTypeName: string) {
  const param = paramTypeMaps.find(p => p.name === paramTypeName)
  const paramTypeId = param.id
  const paramId = param.data.paramId
  await selectStartingParameterType(selectedMachineId.value, paramTypeId, paramId)
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
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        label="Mal (Kumaş) Miktarı - Kilo"
        @update:model-value="handleOptionChange('fabricWeight')"
      />
      <q-select
        v-model="flotteRatio"
        label="AK Flotte Oranı Parametresi"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('flotteRatio')"
      />
      <q-select
        v-model="partCount"
        label="Parça Sayısı"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('partCount')"
      />
      <q-select
        v-model="partyNo"
        label="Parti Numarası"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('partyNo')"
      />
      <q-select
        v-model="accompanyNo"
        label="Refakat Numarası"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('accompanyNo')"
      />
      <q-select
        v-model="clothLength"
        label="Kumaş Uzunluğu"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('clothLength')"
      />
      <q-select
        v-model="customer"
        label="Müşteri"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('customer')"
      />
      <q-select
        v-model="customerOrder"
        label="Sipariş Numarası"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('customerOrder')"
      />
      <q-select
        v-model="fabricType"
        label="Kumaş Tipi"
        :options="parameterOptions"
        option-label="paramString"
        option-value="paramId"
        @update:model-value="handleOptionChange('fabricType')"
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
