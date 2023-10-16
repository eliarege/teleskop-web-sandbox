<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { Machine } from '~/types'

const props = defineProps<{
  machines: Machine[]
  selectedMachines: Machine[]
}>()

const emit = defineEmits(['machine-selection'])

const columns: QTableColumn<Machine>[] = [
  {
    name: 'id',
    label: 'ID',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'code',
    label: 'Makine Adı',
    field: row => row.code,
    align: 'left',
  },
  {
    name: 'group',
    label: 'Grup',
    field: row => row.groupName,
    align: 'left',
  },

  {
    name: 'tbbModel',
    label: 'Model',
    field: row => row.tbbModel,
    align: 'left',
  },

  {
    name: 'version',
    label: 'Versiyon',
    field: row => row.version,
    align: 'left',
  },
  {
    name: 'machineCapacity',
    label: 'Makine Kapasitesi',
    field: row => row.machineCapacity,
    align: 'left',
  },

  {
    name: 'nozzleCount',
    label: 'Kule Sayısı',
    field: row => row.nozzleCount,
    align: 'left',
  },
  {
    name: 'ip',
    label: 'Makine IP',
    field: row => row.ip,
    align: 'left',
  },
  {
    name: 'plcModel',
    label: 'PLC Modeli',
    field: row => row.plcModel,
    align: 'left',
  },
  {
    name: 'inUse',
    label: 'Kullanımda',
    field: (row: any) => row.inUse,
    align: 'left',
  },

]

const pagination = { rowsPerPage: 0 }
</script>

<template>
  <div class="table-scroll">
    <q-table
      :selected="selectedMachines"
      :pagination="pagination"
      :rows="machines"
      :columns="columns"
      hide-pagination
      row-key="id"
      separator="cell"
      bordered
      selection="multiple"
      table-header-class="table-header"
      @selection="(e) => $emit('machine-selection', e)"
    >
      <template #body-cell-inUse="props">
        <q-td :props="props">
          <q-icon
            v-if="props.row.inUse"
            name="play_arrow"
            color="primary"
            size="sm"
          />
          <q-icon
            v-else-if="!props.row.inUse"
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
