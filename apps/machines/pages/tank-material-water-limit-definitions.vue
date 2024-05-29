<script setup lang="ts">
import type { FilterableTableColumn, FilterableTableFilter } from 'nuxt-base'

const { t } = useI18n()

const materialTypeMap = [
  { id: 1, name: t('chemical') },
  { id: 2, name: t('dye') },
  { id: 3, name: t('other') },
]

const columns = computed<FilterableTableColumn[]>(() => ([
  {
    name: 'materialGroupNo',
    label: t('materialType'),
    field: 'materialGroupNo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineName',
    label: t('machineName'),
    field: 'machineName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'tankName',
    label: t('tankName'),
    field: 'tankName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialName',
    label: t('material'),
    field: 'materialName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'preWater',
    label: t('preWater'),
    field: 'preWater',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'betweenWater',
    label: t('betweenWater'),
    field: 'betweenWater',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'postWater',
    label: t('postWater'),
    field: 'postWater',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

const filters = ref<FilterableTableFilter[]>([])

const { data: tankMaterialDefinitions, execute } = useLazyFetch('/api/materials/material-tank-water-definitions', {
  method: 'POST',
  body: { filters },
  default: () => [],
})

async function handleFilterSlotsUpdate(updatedValue: FilterableTableFilter[]) {
  filters.value = updatedValue.map((filter) => {
    if (filter.field === 'materialGroupNo')
      filter.value = materialTypeMap.find(m => m.name === filter.value)!.id
    return filter
  })
  await execute()
}

async function popupUpdate(value: string, rowName: string, props) {
  const tankDefinition = tankMaterialDefinitions.value[props.rowIndex]
  tankDefinition[rowName] = value
  return await $fetch('/api/materials/material-tank-water-definition', {
    method: 'POST',
    body: { tankDefinition, rowName, value },
  })
}
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <FilterableTable
        :rows="tankMaterialDefinitions"
        :columns="columns"
        class="overflow-y-auto h-160"
        @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="props">
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col"
            >
              <span v-if="col.field === 'materialGroupNo'">
                {{ materialTypeMap.find(m => m.id === col.value)?.name ?? '' }}
              </span>

              <span v-else-if="col.field === 'preWater' || col.field === 'betweenWater' || col.field === 'postWater'">
                {{ col.value ?? 0 }}
                <q-popup-edit
                  v-slot="scope"
                  :model-value="col.value"
                  :title="`${col.label}`"
                  buttons
                  @update:model-value="(e) => popupUpdate(e, col.name, props)"
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
.input-field > * {
  margin-right: 2em;
}
</style>
