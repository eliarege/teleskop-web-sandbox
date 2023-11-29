<script setup lang="ts">
import type { WaterType } from '~/types'

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
    field: row => row.waterTypeName,
    align: 'left',
  },
]

const { data, pending, refresh } = useFetch('/api/water-types/water-types', { default: () => [] })

const waterTypeName = ref()

async function handleAddWaterType() {
  console.log('waterTypeName.value = ', waterTypeName.value)
  await addWaterType(waterTypeName.value)
  await refresh()
  waterTypeName.value = ''
}
const selectedWaterType = ref([])

async function handleDeleteWaterTypes() {
  await deleteWaterTypes(selectedWaterType.value.map(d => d.waterTypeId))
  await refresh()
  selectedWaterType.value = []
  waterTypeName.value = ''
}
</script>

<template>
  <q-card>
    <q-card-section>
      <q-input v-model="waterTypeName" label="Su Tipi İsmi" />
      <div class="flex flex-row input-field my-4">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddWaterType()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteWaterTypes()"
        />
      </div>
      <q-table
        v-model:selected="selectedWaterType"
        :loading="pending"
        :rows="data"
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
