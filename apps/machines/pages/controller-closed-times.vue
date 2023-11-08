<script setup lang="ts">
const machines = ref(await getMachines())

const machineOptions = ref(machines.value.map((m) => {
  return { label: m.code, value: m.code }
}))

const closedTimeOptions = ref([
  { label: 'Cihaz yeniden başlatıldı', value: 0 },
  { label: 'Cihaz kapatıldı', value: 1 },
  { label: 'Elektrik kesildi', value: 2 },
  { label: 'Diğer', value: 3 },
])

const machineGroup = ref([])
const closedTimeGroup = ref([])
const dateRange = ref()

const columns = [
  {
    name: 'machineNo',
    label: 'Makine No',
    field: row => row.machineNo,
    align: 'left',
  },
  {
    name: 'machine',
    label: 'Makine',
    field: row => row.machineName,
    align: 'left',
  },
  {
    name: 'eventStart',
    label: 'Başlangıç Tarihi',
    field: row => row.eventStart,
    align: 'left',
  },

  {
    name: 'eventEnd',
    label: 'Bitiş Tarihi',
    field: row => row.eventEnd,
    align: 'left',
  },
  {
    name: 'duration',
    label: 'Süre',
    field: row => row.duration,
    align: 'left',
  },
  {
    name: 'event',
    label: 'Sebep',
    field: row => row.event,
    align: 'left',
  },
]
const rows = ref([])
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section class="h-sm overflow-y-scroll">
      <h3>Makineler</h3>
      <q-option-group
        v-model="machineGroup"
        :options="machineOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-card-section>
      <h3>Sebepler</h3>
      <q-option-group
        v-model="closedTimeGroup"
        :options="closedTimeOptions"
        type="checkbox"
      />
    </q-card-section>
    <q-card-section class="flex flex-col">
      <q-date v-model="dateRange" range />
      <q-btn class="mt-4">
        Göster
      </q-btn>
    </q-card-section>
  </q-card>
  <div class="table-scroll">
    <q-table
      selection="single"
      :rows="rows"
      :columns="columns"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      bordered
      separator="cell"
      table-header-class="table-header"
    />
  </div>
</template>

<style scoped>

</style>
