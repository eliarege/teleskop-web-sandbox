<script setup lang="ts">
const materialTypeMap = [
  { id: 1, name: 'kimyasal' },
  { id: 2, name: 'boya' },
  { id: 3, name: 'diğer' },
]

const columns = [
  {
    name: 'materialGroupNo',
    label: 'Materyal Tipi',
    field: row => row.materialGroupNo,
    align: 'left',
  },
  {
    name: 'machineName',
    label: 'Makine',
    field: row => row.machineName,
    align: 'left',
  },
  {
    name: 'tankName',
    label: 'Kazan Adı',
    field: row => row.tankName,
    align: 'left',
  },
  {
    name: 'materialName',
    label: 'Materyal',
    field: row => row.materialName,
    align: 'left',
  },
  {
    name: 'preWater',
    label: 'Ön Su',
    field: row => row.preWater,
    align: 'left',
  },
  {
    name: 'betweenWater',
    label: 'Orta Su',
    field: row => row.betweenWater,
    align: 'left',
  },
  {
    name: 'postWater',
    label: 'Son Su',
    field: row => row.postWater,
    align: 'left',
  },
]

const { data: tankMaterialDefinitions, pending } = useLazyFetch('/api/materials/material-tank-water-definitions')
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <q-table
        :loading="pending"
        :rows="tankMaterialDefinitions"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="reasonId"
        separator="cell"
        bordered
        table-header-class="table-header"
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
