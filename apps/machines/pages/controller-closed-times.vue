<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'

const { t, d } = useI18n()

const closedTimeOptions = ref([
  { label: 'Cihaz yeniden başlatıldı', closedType: 0 },
  { label: 'Cihaz kapatıldı', closedType: 1 },
  { label: 'Elektrik kesildi', closedType: 2 },
  { label: 'Diğer', closedType: 3 },
])

const columns: Column[] = [
  {
    name: 'machineId',
    label: 'Makine No',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCode',
    label: 'Makine',
    field: 'machineCode',
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
    filterType: 'multiselect',
    selectionOptions: closedTimeOptions.value,
    optionLabel: 'label',
    optionValue: 'closedType',
  },
]

const { data: times } = useLazyFetch('/api/controller-closed-times/controller-closed-times', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleFilterSlotsUpdate(updatedValue) {
  times.value = await $fetch('/api/controller-closed-times/controller-closed-times', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <FilterableTable
    :rows="times"
    :columns="columns"
    class="overflow-y-auto	h-220"
    @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
  >
    <template #custombody="times">
      <q-tr>
        <q-td
          v-for="row in times.cols"
          :key="row"
        >
          <span v-if="row.field === 'closedType'">
            {{ closedTimeOptions.find(o => o.closedType === row.value)?.label }}
          </span>
          <span v-else-if="row.field === 'startTime'">
            {{ d(row.value, 'datetime') }}
          </span>
          <span v-else-if="row.field === 'endTime'">
            {{ d(row.value, 'datetime') }}
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

</style>
