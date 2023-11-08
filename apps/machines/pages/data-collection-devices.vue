<script setup lang="ts">
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
]

const rows = ref([])
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section>
      <div class="flex flex-row justify-around w-3xl">
        <q-input label="Makine No" />
        <q-input label="Makine Adı" />
        <q-checkbox label="Kullanımda" />
      </div>

      <div class="flex flex-row input-field my-8">
        <q-btn
          label="Ekle"
          no-caps
        />
        <q-btn
          label="Düzenle"
          no-caps
        />
        <q-btn
          label="Sil"
          no-caps
        />
      </div>
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
