<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { Machine } from '~/types'
import { addOtherMachine, deleteOtherMachine } from '~/utils'

const columns: Column[] = [
  {
    name: 'machineId',
    label: 'Makine Id',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'equals',

  },
  {
    name: 'machineCode',
    label: 'Makine',
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'equals',
  },
]

const { data: machines, refresh } = useLazyFetch('/api/machines/other-machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<Machine>({
  machineId: undefined,
  machineCode: '',
  inUse: false,
})

const oldId = ref(-1)

async function handleAddClick() {
  await addOtherMachine(selected.value)
  await refresh()
}

async function handleDeleteClick() {
  await deleteOtherMachine(selected.value)
  selected.value = {
    machineId: undefined,
    machineCode: '',
    inUse: false,
  }
  await refresh()
}

function handleSelection(obj: Machine) {
  selected.value = { ...obj }
  oldId.value = obj.machineId
}

async function handleEditClick() {
  await editOtherMachine(selected.value, oldId.value)
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  machines.value = await $fetch('/api/machines/other-machines', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section>
      <div class="flex flex-row justify-around w-3xl">
        <q-input
          v-model="selected.machineId"
          clearable
          filled
          label="Makine No"
        />
        <q-input
          v-model="selected.machineCode"
          clearable
          filled
          label="Makine Adı"
        />
        <q-checkbox v-model="selected.inUse" label="Kullanımda" />
      </div>

      <div class="flex flex-row input-field my-8">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddClick"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditClick"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteClick"
        />
      </div>
    </q-card-section>
  </q-card>
  <FilterableTable
    v-model:selected="selected"
    :rows="machines"
    :columns="columns"
    class="overflow-y-auto h-160"
    @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    @selection="(e) => handleSelection(e)"
  >
    <template #custombody="machines">
      <q-tr
        :class="{ 'selected-row': selected.machineId === machines.row.machineId }"
        @click="handleSelection(machines.row)"
      >
        <q-td
          v-for="row in machines.cols"
          :key="row"
        >
          <span>
            {{ row.value }}
          </span>
        </q-td>
      </q-tr>
    </template>
  </FilterableTable>
</template>

<style scoped>
.input-field > * {
  margin-right: 2em;
}
.selected-row {
  background-color: #cce8ff;
}
</style>
