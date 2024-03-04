<script setup lang="ts">
import type { WaterIO } from '~/types'

interface Water {
  waterIO1: WaterIO | null | undefined
  waterIO2: WaterIO | null | undefined
  waterParam: any | null
}

const { t } = useI18n()

const selectedMachineId = ref()
const selectedCommandNo = ref()

const water = ref<Water>({
  waterIO1: null,
  waterIO2: null,
  waterParam: null,
})

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: machineCommands } = useLazyFetch('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const fetchParams = computed(() => {
  return selectedCommandNo.value && selectedMachineId.value
    ? { machineId: selectedMachineId.value, commandNo: selectedCommandNo.value }
    : undefined
})

const { data: waterIO } = useLazyFetch<WaterIO[]>('/api/io/command-io-all', {
  immediate: false,
  query: fetchParams,
})

const { data: waterParams } = useLazyFetch('/api/commands/command-parameters', {
  immediate: false,
  query: fetchParams,
})

const { data: waterConsumptions } = useLazyFetch('/api/theoretical-water-consumptions/theoretical-water-consumption', {
  immediate: false,
  query: fetchParams,
})

watch([waterConsumptions, waterParams], () => {
  if (waterConsumptions.value && waterConsumptions.value.length) {
    const command = waterConsumptions.value[0]
    water.value.waterIO1 = waterIO.value?.find((io: WaterIO) => io.ioIndex === command.commandIO)
    water.value.waterIO2 = waterIO.value?.find((io: WaterIO) => io.ioIndex === command.commandIO2)
    water.value.waterParam = waterParams.value?.find(io => io.parameterIndex === command.commandParameter)
  }
})

async function handleCommandClick(commandNo: number) {
  selectedCommandNo.value = commandNo
}
const filteredWaterIO1Options = computed(() => {
  // Filter waterIO options based on waterIO2 selection
  return (waterIO.value && water.value.waterIO2)
    ? waterIO.value.filter(io => io.ioIndex !== water.value.waterIO2?.ioIndex)
    : waterIO.value ? waterIO.value : []
})
const filteredWaterIO2Options = computed(() => {
  // Filter waterIO options based on waterIO1 selection
  return (waterIO.value && water.value.waterIO1)
    ? waterIO.value.filter(io => io.ioIndex !== water.value.waterIO1?.ioIndex)
    : waterIO.value ? waterIO.value : []
})

async function handleSubmit() {
  const obj = {
    machineId: selectedMachineId.value,
    commandNo: selectedCommandNo.value,
    commandIO: water.value.waterIO1 ? water.value.waterIO1.ioIndex : undefined,
    commandIO2: water.value.waterIO2 ? water.value.waterIO2.ioIndex : undefined,
    commandParameter: water.value.waterParam ? water.value.waterParam.parameterIndex : undefined,
  }
  await $fetch('/api/theoretical-water-consumptions/theoretical-water-consumption', {
    method: 'POST',
    body: obj,
  })
}

const copy = ref()

function handleCopy() {
  copy.value = selectedMachineId.value
}

async function handlePaste() {
  await $fetch('/api/theoretical-water-consumptions/copy', {
    method: 'POST',
    body: { sourceMachineId: copy.value, targetMachineId: selectedMachineId.value },
  })
}
</script>

<template>
  <div class="flex w-full justify-end my-4">
    <q-btn-group push class="flex flex-row mr-4">
      <q-btn
        :label="t('copy')"
        no-caps
        @click="handleCopy"
      />
      <q-btn
        :label="t('paste')"
        no-caps
        @click="handlePaste"
      />
    </q-btn-group>
  </div>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
      <h3>{{ t('machines') }}</h3>
      <q-list
        bordered
        separator
        class="overflow-y-auto h-160"
      >
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          :active="selectedMachineId === machine.machineId"
          :focused="selectedMachineId === machine.machineId"
          @click="selectedMachineId = machine.machineId"
        >
          <q-item-section>
            {{ machine.machineCode }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>{{ t('commands') }}</h3>
      <q-list
        bordered
        separator
        class="overflow-y-auto h-160"
      >
        <q-item
          v-for="command in machineCommands"
          :key="command.commandNo"
          v-ripple
          clickable
          :active="selectedCommandNo === command.commandNo"
          :focused="selectedCommandNo === command.commandNo"
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
        <h3>{{ t('waterSourceIO') }}</h3>
        <q-select
          v-model="water.waterIO1"
          :options="filteredWaterIO1Options"
          option-label="name"
          option-value="ioIndex"
          class="mb-2"
        />
        <q-select
          v-model="water.waterIO2"
          :options="filteredWaterIO2Options"
          option-label="name"
          option-value="ioIndex"
          class="mb-2"
        />
      </div>
      <div class="w-xs flex flex-col">
        <h3>{{ t('waterAmountParameter') }}</h3>
        <q-select
          v-model="water.waterParam"
          :options="waterParams"
          option-label="paramString"
          option-value="parameterIndex"
        />
      </div>
    </q-card-section>
  </q-card>
  <div class="flex w-full justify-end">
    <q-btn-group class="mt-4 mr-4">
      <q-btn no-caps :label="t('submit')" @click="handleSubmit" />
      <q-btn no-caps :label="t('cancel')" />
    </q-btn-group>
  </div>
</template>

<style scoped>

</style>
