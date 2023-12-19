<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'

const materialTypeMap = [
  { id: 1, name: 'kimyasal' },
  { id: 2, name: 'boya' },
  { id: 3, name: 'diğer' },
]

const columns = [
  {
    name: 'materialGroupNo',
    label: 'Materyal Tipi',
    field: 'materialGroupNo',
    align: 'left',
  },
  {
    name: 'machineName',
    label: 'Makine',
    field: 'machineName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'tankName',
    label: 'Kazan Adı',
    field: 'tankName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialName',
    label: 'Materyal',
    field: 'materialName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'preWater',
    label: 'Ön Su',
    field: 'preWater',
    align: 'left',
  },
  {
    name: 'betweenWater',
    label: 'Orta Su',
    field: 'betweenWater',
    align: 'left',
  },
  {
    name: 'postWater',
    label: 'Son Su',
    field: 'postWater',
    align: 'left',
  },
]

const filters = ref()

const { data: tankMaterialDefinitions, execute, pending } = await useAsyncData(async () => {
  const res = await $fetch('/api/materials/material-tank-water-definitions', {
    method: 'POST',
    body: { filters: filters.value },
  })
  return res
})

async function handleFilterSlotsUpdate(updatedValue) {
  filters.value = updatedValue
  await execute()
}
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <FilterableTable
        :loading="pending"
        :rows="tankMaterialDefinitions"
        :columns="columns"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>
:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.input-field > * {
  margin-right: 2em;
}
</style>
