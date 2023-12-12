<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import { getControllerClosedTimes } from '~/utils'

const closedTimeOptions = ref([
  { label: 'Cihaz yeniden başlatıldı', value: 0 },
  { label: 'Cihaz kapatıldı', value: 1 },
  { label: 'Elektrik kesildi', value: 2 },
  { label: 'Diğer', value: 3 },
])

const columns = [
  {
    name: 'machineId',
    label: 'Makine No',
    field: 'machineId',
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
    name: 'startTime',
    label: 'Başlangıç Tarihi',
    field: 'startTime',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },

  {
    name: 'endTime',
    label: 'Bitiş Tarihi',
    field: 'endTime',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },
  {
    name: 'duration',
    label: 'Süre',
    field: 'duration',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'closedType',
    label: 'Sebep',
    field: 'closedType',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const machineGroups = ref([])
const closedTimeGroups = ref([])
const machineOptions = ref([])
const times = ref([])

const { data: machines } = useLazyFetch('/api/machines/machines')

watch(machines, (newValue, oldValue) => {
  machineOptions.value = machines.value.map((m) => {
    return { label: m.code, value: m.id }
  })
})

async function loadTimes() {
  times.value = await getControllerClosedTimes(machineGroups.value, closedTimeGroups.value)
}

async function handleFilterSlotsUpdate(updatedValue) {
  times.value = await $fetch('/api/controller-closed-times/controller-closed-times', {
    method: 'POST',
    body: {
      machineIds: machineGroups.value,
      closedTypes: closedTimeGroups.value,
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section class="h-sm overflow-y-scroll">
      <h3>Makineler</h3>
      <q-option-group
        v-model="machineGroups"
        :options="machineOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-card-section>
      <h3>Sebepler</h3>
      <q-option-group
        v-model="closedTimeGroups"
        :options="closedTimeOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-btn @click="loadTimes">
      Yükle
    </q-btn>
  </q-card>
  <div class="table-scroll">
    <FilterableTable
      :rows="times"
      :columns="columns"
      @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    >
      <template #custombody="times">
        <q-tr>
          <q-td
            v-for="row in times.cols"
            :key="row"
          >
            <span v-if="row.field === 'closedType'">
              {{ closedTimeOptions.find(o => o.value === row.value)?.label }}
            </span>
            <span v-else>
              {{ row.value }}
            </span>
          </q-td>
        </q-tr>
      </template>
    </FilterableTable>
  </div>
</template>

<style scoped>

</style>
