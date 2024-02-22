<script setup lang="ts">
import { selectStartingParameterType } from '~/utils'

const { t } = useI18n()

const selectedMachineId = ref()

const paramTypeMaps = reactive([
  { id: 0, name: 'fabricWeight', data: undefined, label: t('fabricWeight') },
  { id: 1, name: 'flotteRatio', data: undefined, label: t('flotteRatio') },
  { id: 2, name: 'partCount', data: undefined, label: t('partCount') },
  { id: 3, name: 'partyNo', data: undefined, label: t('partyNo') },
  { id: 4, name: 'accompanyNo', data: undefined, label: t('accompanyNo') },
  { id: 5, name: 'clothLength', data: undefined, label: t('clothLength') },
  { id: 6, name: 'customer', data: undefined, label: t('customer') },
  { id: 7, name: 'customerOrder', data: undefined, label: t('customerOrder') },
  { id: 8, name: 'fabricType', data: undefined, label: t('fabricType') },
])

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: parameterOptions } = useLazyFetch('/api/starting-parameter-types/starting-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameterOptions) => {
    parameterOptions.unshift({
      paramId: -1,
      paramString: t('notSelected'),
    })
    return parameterOptions
  },
})

const { data: parameterTypes } = useLazyFetch('/api/starting-parameter-types/starting-parameter-types', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

watch(parameterTypes, (_newValue, _oldValue) => {
  for (const paramTypeMap of paramTypeMaps) {
    paramTypeMap.data = parameterTypes.value.find(t => t.paramTypeId === Number(paramTypeMap.id)) || { paramId: -1, paramString: t('notSelected') }
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleOptionChange(paramType: object) {
  const paramTypeId = paramType.id
  const paramId = paramType.data.paramId
  await selectStartingParameterType(selectedMachineId.value, paramTypeId, paramId)
}

const copy = ref()
function handleCopy() {
  copy.value = JSON.parse(JSON.stringify(paramTypeMaps))
}

async function handlePaste() {
  for (const paramType of copy.value) {
    await handleOptionChange(paramType)
  }
}
</script>

<template>
  <q-btn-group push class="flex flex-row ">
    <q-btn
      label="Copy"
      no-caps
      @click="handleCopy"
    />
    <q-btn
      label="Paste"
      no-caps
      @click="handlePaste"
    />
  </q-btn-group>
  <q-card class="flex flex-row justify-center">
    <q-card-section class="w-sm">
      <h3>{{ t('machines') }}</h3>
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
      <div v-for="paramTypeMap in paramTypeMaps" :key="paramTypeMap.id">
        <q-select
          v-model="paramTypeMap.data"
          :options="parameterOptions"
          option-label="paramString"
          option-value="paramId"
          :label="paramTypeMap.label"
          @update:model-value="handleOptionChange(paramTypeMap)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.input-field > * {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
