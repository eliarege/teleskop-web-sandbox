<script setup lang="ts">
import { getWaterTypes } from '~/utils'

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'reasonText',
    label: 'Atlatma Nedeni',
    field: row => row.reasonText,
    align: 'left',
  },
]

const { data: stepSkippingReasons, pending, refresh } = useFetch('/api/step-skipping-reasons/step-skipping-reasons', { default: () => [] })

const selectedReason = ref()
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="input-field flex flex-row">
        <q-input label="Numara" />
        <q-input label="Atlatma Nedeni" />
      </div>
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
        v-model:selected="selectedReason"
        :rows="stepSkippingReasons"
        :columns="columns"
        :loading="pending"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        row-key="id"
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
