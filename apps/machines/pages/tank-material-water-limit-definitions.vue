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
    filterable: true,
    filterType: 'includes',
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
  console.log('updatedValue = ', updatedValue)

  filters.value = updatedValue.map((filter) => {
    if (filter.field === 'materialGroupNo')
      filter.value = materialTypeMap.find(m => m.name === filter.value).id
    return filter
  })
  console.log('filters.value = ', filters.value)
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
      >
        <template #custombody="tankMaterialDefinitions">
          <q-tr>
            <q-td
              v-for="row in tankMaterialDefinitions.cols"
              :key="row"
            >
              <span v-if="row.field === 'materialGroupNo'">
                {{ materialTypeMap.find(m => m.id === row.value).name }}
              </span>
              <span v-else>
                {{ row.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </FilterableTable>
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
