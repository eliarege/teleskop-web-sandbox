<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { Machine } from '~/types'

const columns: Column<Machine>[] = [
  {
    name: 'machineId',
    label: 'ID',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCode',
    label: 'Makine Adı',
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'groupName',
    label: 'Grup',
    field: 'groupName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'tbbModel',
    label: 'Model',
    field: 'tbbModel',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'version',
    label: 'Versiyon',
    field: 'version',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCapacity',
    label: 'Makine Kapasitesi',
    field: 'machineCapacity',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'nozzleCount',
    label: 'Kule Sayısı',
    field: 'nozzleCount',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'ip',
    label: 'Makine IP',
    field: 'ip',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'plcModel',
    label: 'PLC Modeli',
    field: 'plcModel',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'inUse',
    label: 'Kullanımda',
    field: 'inUse',
    align: 'left',
  },

]
const { data: machines, refresh } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<Machine>({
  machineId: -1,
})

function handleSelection(obj: Machine) {
  if (selected.value?.machineId === obj.machineId) {
    selected.value = {
      machineId: -1,
    }
  } else {
    selected.value = obj
  }
}

async function handleFilterSlotsUpdate(updatedValue) {
  machines.value = await $fetch('/api/machines/machines', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <Menubar
    :machines="machines"
    :selected="selected"
    @delete-machine="refresh"
    @add-machine="refresh"
  />
  <FilterableTable
    v-model:selected="selected"
    :rows="machines"
    :columns="columns"
    class="overflow-y-auto h-220"
    @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
  >
    <template #custombody="machines">
      <q-tr
        :class="{ 'selected-row': selected.machineId === machines.row.machineId }"
        @click="handleSelection(machines.row)"
      >
        <q-td
          v-for="row in machines.cols"
          :key="row"
        >
          <span v-if="row.field === 'inUse'">
            {{ row.value ? 'Evet' : 'Hayır' }}
          </span>
          <span v-else>
            {{ row.value }}
          </span>
        </q-td>
      </q-tr>
    </template>
  </FilterableTable>
</template>

<style scoped>
.selected-row {
  background-color: #cce8ff;
}
</style>
