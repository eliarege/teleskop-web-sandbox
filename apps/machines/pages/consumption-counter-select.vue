<script setup lang="ts">
import type { IContextMenuOption } from '~/components/ContextMenu.vue'

const { t } = useI18n()

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
      name: t('notSelected'),
    })
    return counterOptions
  },
})

const { data: counters } = useLazyFetch('/api/consumption-counters/consumption-counter', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

watch(counters, (newValue, oldValue) => {
  if (counterOptions.value && counterOptions.value.length && counters.value && counters.value.counter1 && counters.value.counter2) {
    counter1.value = counterOptions.value.find(option => option.id === counters.value.counter1)
    counter2.value = counterOptions.value.find(option => option.id === counters.value.counter2)
  } else {
    counter1.value = ''
    counter2.value = ''
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleOptionChange() {
  await selectConsumptionCounter(selectedMachineId.value, counter1.value.id, counter2.value.id)
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selectedMachineId.value === -1,
    onClick: () => {
      copy.value = { counter1: counter1.value, counter2: counter2.value }
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selectedMachineId.value === -1,
    onClick: async () => {
      counter1.value = copy.value.counter1
      counter2.value = copy.value.counter2
      await handleOptionChange()
    },
  },
])
</script>

<template>
  <ContextMenu :context-menu-options="contextMenuOptions" @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)" />
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
          :active="selectedMachineId === machine.machineId"
          :focused="selectedMachineId === machine.machineId"
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
        :label="`${t('counter')} 1`"
        @update:model-value="handleOptionChange()"
      />
      <q-select
        v-model="counter2"
        :options="counterOptions"
        option-label="name"
        option-value="id"
        :label="`${t('counter')} 2`"
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
