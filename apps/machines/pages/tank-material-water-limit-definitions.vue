<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import { updateTankMaterialWaterDefinition } from '~/utils'

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

const filters = ref([])

const { data: tankMaterialDefinitions, execute } = useLazyFetch('/api/materials/material-tank-water-definitions', {
  method: 'POST',
  body: { filters },
  default: () => [],
})

async function handleFilterSlotsUpdate(updatedValue) {
  filters.value = updatedValue.map((filter) => {
    if (filter.field === 'materialGroupNo')
      filter.value = materialTypeMap.find(m => m.name === filter.value).id
    return filter
  })
  await execute()
}

async function popupUpdate(value, rowName, props) {
  const tankDefinition = tankMaterialDefinitions.value[props.rowIndex]
  tankDefinition[rowName] = value
  await updateTankMaterialWaterDefinition({ tankDefinition, rowName, value })
}
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <FilterableTable
        :rows="tankMaterialDefinitions"
        :columns="columns"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="tankMaterialDefinitions">
          <q-tr :props="tankMaterialDefinitions">
            <q-td
              v-for="col in tankMaterialDefinitions.cols"
              :key="col"
            >
              <span v-if="col.field === 'materialGroupNo'">
                {{ materialTypeMap.find(m => m.id === col.value).name }}
              </span>

              <span v-else-if="col.field === 'preWater' || col.field === 'betweenWater' || col.field === 'postWater'">
                {{ col.value ?? 0 }}
                <q-popup-edit
                  v-slot="scope"
                  :model-value="col.value"
                  :title="`${col.label}`"
                  buttons
                  @update:model-value="(e) => popupUpdate(e, col.name, tankMaterialDefinitions)"
                >
                  <q-input
                    v-model="scope.value"
                    type="number"
                    dense
                    autofocus
                  />
                </q-popup-edit>
              </span>

              <span v-else>
                {{ col.value }}
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
