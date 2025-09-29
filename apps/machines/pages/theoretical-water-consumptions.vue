<script setup lang="ts">
import type { CommandParameter, WaterIO } from '~/types'

interface Water {
  waterIO1: WaterIO | null | undefined
  waterIO2: WaterIO | null | undefined
  waterParam: any | null
}

const { t } = useI18n()
const kc = useKeycloak()
const selectedMachineId = ref()
const selectedCommandNo = ref()

const water = ref<Water>({
  waterIO1: null,
  waterIO2: null,
  waterParam: null,
})

const { data: machines } = useAuthFetch('/api/machines/active-machines')

const { data: machineCommands } = useAuthFetch('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const fetchParams = computed(() => {
  return selectedCommandNo.value && selectedMachineId.value
    ? { machineId: selectedMachineId.value, commandNo: selectedCommandNo.value }
    : undefined
})

const { data: waterIO } = useAuthFetch<WaterIO[]>('/api/io/command-io-all', {
  immediate: false,
  query: fetchParams,
})

const { data: waterParams } = useAuthFetch<readonly CommandParameter[]>('/api/commands/command-parameters', {
  immediate: false,
  query: fetchParams,
})

const { data: waterConsumptions } = useAuthFetch('/api/theoretical-water-consumptions/theoretical-water-consumption', {
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
  await kc.fetch('/api/theoretical-water-consumptions/theoretical-water-consumption', {
    method: 'POST',
    body: obj,
  })
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value,
    onClick: () => {
      copy.value = selectedMachineId.value
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      await kc.fetch('/api/theoretical-water-consumptions/copy', {
        method: 'POST',
        body: { sourceMachineId: copy.value, targetMachineId: selectedMachineId.value },
      })
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :options="contextMenuOptions"
      target=".q-list"
      @click="option => option.onClick(selectedMachineId)"
    />
    <q-card>
      <q-card-section class="flex flex-row justify-around">
        <div class="w-sm">
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
        </div>

        <div class="w-sm">
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
        </div>

        <div class="w-xs flex flex-col">
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
              :options="waterParams || []"
              option-label="paramString"
              option-value="parameterIndex"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="m-4">
        <q-btn no-caps :label="t('cancel')" />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>

</style>
