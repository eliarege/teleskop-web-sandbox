<script setup lang="ts">
import type { MachineDataRaw } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps<{ machines: MachineDataRaw[], erpKey: string }>()
const store = useDataStore()

const selectedMachines = defineModel('selectedMachine', { type: Array as PropType<number[]>, required: true })

const allSelected = computed(() => {
  return selectedMachines.value.length === props.machines.length
})

const isIndeterminate = computed(() => {
  return selectedMachines.value.length > 0 && !allSelected.value
})

function singleToggle(id: number) {
  if (store.erpKeys.map(m => m.id).includes(id)) {
    store.erpKeys.filter(e => e.id === id).forEach((e) => {
      e.key = props.erpKey
    })
  } else {
    store.erpKeys.push({ id, key: props.erpKey } as { id: number, key: string })
  }
}

function toggleAll() {
  if (allSelected.value) {
    store.erpKeys = []
  } else {
    props.machines.forEach((m) => {
      if (store.erpKeys.map(m => m.id).includes(m.id)) {
        store.erpKeys.filter(e => e.id === m.id).forEach((e) => {
          e.key = props.erpKey
        })
      } else {
        store.erpKeys.push({ id: m.id, key: props.erpKey } as { id: number, key: string })
      }
    })
  }
}
</script>

<template>
  <div :class="selectedMachines.length > 0 ? 'border-1' : ''" class="md:max-h-48 sm:max-h-32 overflow-auto">
    <q-list>
      <q-item v-show="erpKey" dense>
        <q-item-section avatar>
          <q-checkbox
            :model-value="allSelected"
            :indeterminate="isIndeterminate"
            dense
            @update:model-value="toggleAll"
          />
        </q-item-section>
        <q-item-section>
          <span class="md:text-sm sm:text-xs">Tümünü Seç</span>
        </q-item-section>
      </q-item>

      <q-item
        v-for="machine in machines"
        :key="machine.id"
        dense
      >
        <q-item-section avatar>
          <q-checkbox
            v-model="selectedMachines"
            :val="machine.id"
            dense
            @update:model-value="singleToggle(machine.id)"
          />
        </q-item-section>
        <q-item-section>
          <span class="md:text-sm sm:text-xs">{{ machine.name }}</span>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>
