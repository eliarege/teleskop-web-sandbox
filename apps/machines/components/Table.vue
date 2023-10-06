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

  {
    name: 'version',
    label: 'Versiyon',
    field: (row: any) => row.version,
    align: 'left',
  },
  {
    name: 'machineCapacity',
    label: 'Makine Kapasitesi',
    field: (row: any) => row.machineCapacity,
    align: 'left',
  },

  {
    name: 'towerCount',
    label: 'Kule Sayısı',
    field: (row: any) => row.towerCount,
    align: 'left',
  },
  {
    name: 'machineIP',
    label: 'Makine IP',
    field: (row: any) => row.machineIP,
    align: 'left',
  },
  {
    name: 'atUse',
    label: 'Kullanımda',
    field: (row: any) => row.atUse,
    align: 'left',
  },
  {
    name: 'PLCModel',
    label: 'PLC Modeli',
    field: (row: any) => row.PLCModel,
    align: 'left',
  },

]
const rows = [
  {
    id: 1,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },
  {
    id: 2,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 3,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 4,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 5,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 6,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 7,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 8,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 9,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

  {
    id: 10,
    machineName: '900HT3',
    group: 'HT-2',
    model: 'T7000',
    version: '3.19.1.RC.16',
    machineCapacity: 540,
    towerCount: 3,
    machineIP: '10.0.10.4',
    atUse: true,
    PLCModel: 'TBBPLC',
  },

]

const pagination = { rowsPerPage: 0 }
const selected = ref([])
</script>

<template>
  <q-table
    v-model:selected="selected"
    :pagination="pagination"
    :rows="rows"
    :columns="columns"
    hide-pagination
    separator="cell"
    bordered
    selection="multiple"
    table-header-class="table-header"
  />
</template>

<style scoped>
:deep .table-header > th {
  font-weight: bold;
}
</style>
