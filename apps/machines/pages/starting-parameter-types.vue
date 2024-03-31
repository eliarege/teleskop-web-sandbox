<script setup lang="ts">
import { klona } from 'klona'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import { selectStartingParameterType } from '~/utils'

const { t } = useI18n()

const selectedMachineId = ref()

const paramTypeMaps = reactive([
  { id: 0, name: 'fabricWeight', data: undefined },
  { id: 1, name: 'flotteRatio', data: undefined },
  { id: 2, name: 'partCount', data: undefined },
  { id: 3, name: 'partyNo', data: undefined },
  { id: 4, name: 'accompanyNo', data: undefined },
  { id: 5, name: 'clothLength', data: undefined },
  { id: 6, name: 'customer', data: undefined },
  { id: 7, name: 'customerOrder', data: undefined },
  { id: 8, name: 'fabricType', data: undefined },
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

async function handleOptionChange(paramType: object) {
  const paramTypeId = paramType.id
  const paramId = paramType.data.paramId
  await selectStartingParameterType(selectedMachineId.value, paramTypeId, paramId)
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
      copy.value = klona(paramTypeMaps)
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selectedMachineId.value === -1,
    onClick: async () => {
      for (const paramType of copy.value) {
        await handleOptionChange(paramType)
      }
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
          @click="selectedMachineId = machine.machineId"
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
          :label="t(paramTypeMap.name)"
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
