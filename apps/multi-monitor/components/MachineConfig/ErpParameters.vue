<script setup lang="ts">
import { useDataStore } from '~/store/Datas'
import type { MachineDataRaw } from '~/shared/types'

const store = useDataStore()

const erpParameters = computed(() => {
  const keys = store.machines
    .map(m => Object.keys(m.erp ?? {}))
    .flat()
  return [...new Set(keys)]
})

const selected = ref()

const selectedMachines = computed(() => store.erpKeys.filter(e => e.key === selected.value).map(e => e.id))
const availableMachines = ref<MachineDataRaw[]>([])

function setValidMachines(paramName: string) {
  selected.value = paramName

  availableMachines.value = store.machines.filter(e =>
    Object.keys(e.erp ?? {}).includes(paramName),
  )
}
</script>

<template>
  <div class="wrapper">
    <q-list
      dense
      bordered
      padding
    >
      <q-item
        v-for="(item, idx) in erpParameters"
        :key="idx"
        :active="selected === item"
        clickable
        @click="setValidMachines(item)"
      >
        <q-item-section>
          {{ item }}
        </q-item-section>
      </q-item>
    </q-list>
    <q-space />
    <div>
      <MachineConfigMultiMachineSelect
        v-model:selected-machine="selectedMachines"
        :machines="availableMachines"
        :erp-key="selected"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  grid-template-columns: 1fr 0.1fr 1fr;
  @apply grid gap-2 p-3 w-full;
}
</style>
