<script setup lang="ts">
const { data: machines } = await useFetch('/api/machine/machines')

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: (row: any) => row.MACHINEID,
    align: 'left',
  },
  {
    name: 'machineName',
    label: 'Makine Adı',
    field: (row: any) => row.MACHINECODE,
    align: 'left',
  },
  {
    name: 'group',
    label: 'Grup',
    field: (row: any) => row.GROUPNAME,
    align: 'left',
  },

  {
    name: 'model',
    label: 'Model',
    field: (row: any) => row.TBBMODEL,
    align: 'left',
  },

  {
    name: 'version',
    label: 'Versiyon',
    field: (row: any) => row.VERSION,
    align: 'left',
  },
  {
    name: 'machineCapacity',
    label: 'Makine Kapasitesi',
    field: (row: any) => row.MACHINECAPACITY,
    align: 'left',
  },

  {
    name: 'nozzleCount',
    label: 'Kule Sayısı',
    field: (row: any) => row.NOZZLECOUNT,
    align: 'left',
  },
  {
    name: 'machineIP',
    label: 'Makine IP',
    field: (row: any) => row.IP,
    align: 'left',
  },
  {
    name: 'PLCModel',
    label: 'PLC Modeli',
    field: (row: any) => row.PlcModel,
    align: 'left',
  },
  {
    name: 'inUse',
    label: 'Kullanımda',
    field: (row: any) => row.INUSE,
    align: 'left',
  },

]

const pagination = { rowsPerPage: 0 }
const selected = ref([])
</script>

<template>
  <div class="table-scroll">
    <q-table
      v-model:selected="selected"
      :pagination="pagination"
      :rows="machines"
      :columns="columns"
      hide-pagination
      row-key="MACHINEID"
      separator="cell"
      bordered
      selection="multiple"
      table-header-class="table-header"
    >
      <template #body-cell-inUse="props">
        <q-td :props="props">
          <q-icon
            v-if="props.row.INUSE"
            name="play_arrow"
            color="primary"
            size="sm"
          />
          <q-icon
            v-else-if="!props.row.INUSE"
            name="stop"
            color="primary"
            size="sm"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<style scoped>
:deep .table-header>th {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}
</style>
