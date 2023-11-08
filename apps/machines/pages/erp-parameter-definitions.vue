<script setup lang="ts">
const machineRows = ref([])

const machineColumns = [
  {
    name: 'machineId',
    label: 'Makine Id',
    field: row => row.machineId,
    align: 'left',
  },
  {
    name: 'machineName',
    label: 'Makine Adı',
    field: row => row.machineName,
    align: 'left',
  },
]

const parameterRows = ref([])

const parameterColumns = [
  {
    name: 'parameterId',
    label: 'Parametre Id',
    field: row => row.parameterId,
    align: 'left',
  },
  {
    name: 'ParameterName',
    label: 'Parametre Adı',
    field: row => row.parameterName,
    align: 'left',
  },
]

const erpMatchingOptions = [{ label: 'Bitir', value: 3 }, { label: 'Atla', value: 4 }, { label: 'Makine Duraklatma', value: 5 }]
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-start input-field">
        <q-input
          label="Parametre İsmi"
          filled
          class="w-xs"
        />
        <q-select
          :options="erpMatchingOptions"
          label="ERP Eşleştirme Alanı"
          filled
          class="w-xs"
        />
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
      <div class="flex flex-row justify-evenly">
        <q-table
          :rows="machineRows"
          :columns="machineColumns"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          row-key="machineId"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
          class="w-3xl"
        />
        <q-table
          :rows="parameterRows"
          :columns="parameterColumns"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          row-key="parameterId"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
          class="w-3xl"
        />
      </div>
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
