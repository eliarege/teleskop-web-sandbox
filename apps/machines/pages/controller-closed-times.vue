<script setup lang="ts">
import type { FilterableTableColumn, FilterableTableFilter } from '@teleskop/nuxt-base'

const kc = useKeycloak()
const { t, d } = useI18n()

const closedTimeOptions = computed(() => ([
  { label: t('controllerRestart'), closedType: 0 },
  { label: t('controllerShutdown'), closedType: 1 },
  { label: t('powerCut'), closedType: 2 },
  { label: t('other'), closedType: 3 },
]))

const columns = computed<FilterableTableColumn[]>(() => ([
  {
    name: 'machineId',
    label: t('machineNo'),
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCode',
    label: t('machine'),
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'startTime',
    label: t('startDate'),
    field: 'startTime',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },

  {
    name: 'endTime',
    label: t('endDate'),
    field: 'endTime',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },
  {
    name: 'duration',
    label: t('duration'),
    field: 'duration',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'closedType',
    label: t('cause'),
    field: 'closedType',
    align: 'left',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: closedTimeOptions.value,
    optionLabel: 'label',
    optionValue: 'closedType',
  },
]))

const { data: times } = useAuthFetch('/api/controller-closed-times/controller-closed-times', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleFilterSlotsUpdate(updatedValue: FilterableTableFilter[]) {
  times.value = await kc.fetch('/api/controller-closed-times/controller-closed-times', {
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
    @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
  >
    <template #custombody="props">
      <q-tr>
        <q-td
          v-for="row in props.cols"
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
          <span v-else-if="row.field === 'duration'">
            {{ Math.floor(row.value / 3600) }}h {{ Math.floor((row.value % 3600) / 60) }}m {{ row.value % 60 }}s
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
