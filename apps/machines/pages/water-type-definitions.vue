<script setup lang="ts">
const columns = [
  {
    name: 'waterTypeId',
    label: 'Su Tipi No',
    field: row => row.waterTypeId,
    align: 'left',
  },
  {
    name: 'waterTypeName',
    label: 'Su Tipi İsmi',
    field: row => row.waterTypeId,
    align: 'left',
  },
]

const rows = ref([])
const selectedType = ref()
</script>

<template>
  <q-card>
    <q-card-section>
      <q-input label="Su Tipi İsmi" />
      <div class="flex flex-row input-field my-4">
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

      <q-table
        v-model:selected="selectedType"
        :rows="rows"
        :columns="columns"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="waterTypeId"
        separator="cell"
        bordered
        selection="single"
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
