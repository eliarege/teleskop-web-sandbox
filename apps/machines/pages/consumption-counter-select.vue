<script setup lang="ts">
import type { IContextMenuOption } from '~/components/ContextMenu.vue'

interface ConsumptionCounter {
  machineId: number
  counterId1: number
  counterId2: number
}

interface CounterOption {
  id: number
  name: string
}

const { t } = useI18n()

const selectedMachineId = ref()

const counter1 = ref()
const counter2 = ref()

const changedCounters = ref<ConsumptionCounter[]>([])

const { data: machines } = useAuthFetch('/api/machines/active-machines')

const { data: counterOptions } = useAuthFetch('/api/consumption-counters/mach-counters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (counterOptions) => {
    counterOptions.unshift({
      id: -1,
      name: t('notSelected'),
    })
    return counterOptions as readonly CounterOption[]
  },
})

const { data: counters } = useAuthFetch('/api/consumption-counters/consumption-counter', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

watch(counters, (_newValue, _oldValue) => {
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

function handleOptionChange() {
  changedCounters.value.push({ machineId: selectedMachineId.value, counterId1: counter1.value.id, counterId2: counter2.value.id })
}

async function handleSubmit() {
  await $fetch('/api/consumption-counters/consumption-counters', {
    method: 'PUT',
    body: { changedCounters: changedCounters.value },
  })
  changedCounters.value = []
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
      copy.value = { counter1: counter1.value, counter2: counter2.value }
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      counter1.value = copy.value.counter1
      counter2.value = copy.value.counter2
      handleOptionChange()
      await handleSubmit()
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-list"
      @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)"
    />
    <q-card>
      <q-card-section class="flex flex-row justify-center gap-8">
        <div class="w-sm">
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
        </div>

        <div v-if="counterOptions" class="flex flex-col input-field">
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
        </div>
      </q-card-section>

      <q-card-actions align="right" class="mt-4 mr-4">
        <q-btn
          no-caps
          :label="t('cancel')"
          @click="$router.go(0)"
        />
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
.input-field > * {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
