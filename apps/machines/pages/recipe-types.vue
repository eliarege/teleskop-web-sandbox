<script setup lang="ts">
import { getRecipeTypes } from '~/utils'

const columns = [
  {
    name: 'typeName',
    label: 'Reçete Tip Adı',
    field: row => row.typeName,
    align: 'left',
  },
]

const { data } = await useAsyncData('recipes', () => getRecipeTypes())
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section>
      <q-input label="Reçete Tipi Adı" />
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
      :rows="data"
      :columns="columns"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      row-key="typeName"
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
