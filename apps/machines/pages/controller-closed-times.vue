<script setup lang="ts">
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
  },
  {
    name: 'machineName',
    label: 'Makine',
    field: 'machineName',
    align: 'left',
  },
  {
    name: 'startTime',
    label: 'Başlangıç Tarihi',
    field: 'startTime',
    align: 'left',
  },

  {
    name: 'endTime',
    label: 'Bitiş Tarihi',
    field: 'endTime',
    align: 'left',
  },
  {
    name: 'duration',
    label: 'Süre',
    field: 'duration',
    align: 'left',
  },
  {
    name: 'closedType',
    label: 'Sebep',
    field: 'closedType',
    align: 'left',
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
    <q-table
      selection="single"
      :rows="times"
      :columns="columns"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      bordered
      separator="cell"
      table-header-class="table-header"
    >
      <template #body-cell-closedType="props">
        <q-td :props="props">
          {{ closedTimeOptions.find(o => o.value === props.row.closedType)?.label }}
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<style scoped>

</style>
