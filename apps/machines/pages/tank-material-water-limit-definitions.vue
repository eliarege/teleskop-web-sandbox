<script setup lang="ts">
const columns = [
  {
    name: 'reasonID',
    label: 'Materyal Tipi',
    field: row => row.reasonId,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Makine',
    field: row => row.typeId,
    align: 'left',
  },
  {
    name: 'text',
    label: 'Kazan Adı',
    field: row => row.text,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Materyal',
    field: row => row.typeId,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Ön Su',
    field: row => row.typeId,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Orta Su',
    field: row => row.typeId,
    align: 'left',
  },
  {
    name: 'type',
    label: 'Son Su',
    field: row => row.typeId,
    align: 'left',
  },
]
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-col">
      <div class="flex flex-row mb-8">
        <q-select class="w-xs" label="Materyal Tipi" />
        <q-select class="w-xs" label="Makine" />
        <q-select class="w-xs" label="Kazan Adı" />
        <q-select class="w-xs" label="Materyal" />
      </div>
      <q-table
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
