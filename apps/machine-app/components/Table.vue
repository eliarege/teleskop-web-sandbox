<script setup lang="ts">
const columns = [
  {
    name: 'id',
    label: 'ID',
    field: (row: any) => row.id,
    align: 'left',
  },
  {
    name: 'machineName',
    label: 'Makine Adı',
    field: (row: any) => row.machineName,
    align: 'left',
  },
  {
    name: 'group',
    label: 'Grup',
    field: (row: any) => row.group,
    align: 'left',
  },

  {
    name: 'model',
    label: 'Model',
    field: (row: any) => row.model,
    align: 'left',
  },
]
const rows = [
  {
    id: 1,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
  },
  {
    id: 2,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
  },

  {
    id: 3,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
  },

  {
    id: 4,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
  },

  {
    id: 1,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
  },

]
</script>

<template>
  <q-table
    :rows="rows"
    :columns="columns"
  />
</template>

<style scoped>

</style>
