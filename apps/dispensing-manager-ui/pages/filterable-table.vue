<script setup lang="ts">
import type { FilterableTableColumn, FilterableTableFilter } from 'nuxt-base'

const { t } = useI18n()
const returnType = [
  // Same columns name with multiselect have OR relationship
  { column: 'x', method: 'multiselect', operation: '=', value: 'H-400' },
  { column: 'x', method: 'multiselect', operation: '=', value: 'H-500' },
  { column: 'x', method: 'multiselect', operation: '=', value: 'H-600' },
  // AND relation with all the other relations
  { column: 'y', method: 'select', operation: '=', value: '17 / Apre' },
  //
  { column: 'z', method: 'date', operation: '<', value: '2023-07-18' },
  // If its date interval there will be 2 records and they will have AND relation
  { column: 'a', method: 'date', operation: '<', value: '2023-05-18' },
  { column: 'a', method: 'date', operation: '=>', value: '2022-05-18' },
  // Will have AND relation
  { column: 'b', method: 'comparison', operation: '<', value: 12 },
  { column: 'c', method: 'comparison', operation: '<', value: 20 },
  { column: 'c', method: 'comparison', operation: '>', value: '10' },
  { column: 'd', method: 'comparison', operation: '=', value: '' },
  { column: 'e', method: 'boolean', operation: '=', value: true },
]

const machines = await $fetch('/api/machine/machines')
const jobordersTemp = await $fetch('/api/joborder/joborders')
const rows = ref()
rows.value = jobordersTemp

const columns: Array<FilterableTableColumn> = [
  {
    name: 'joborder',
    label: t('joborder'),
    field: 'joborder',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'correctionNo',
    label: t('correctionNo'),
    field: 'correctionNo',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'plannedMachineName',
    label: t('plannedMachine'),
    field: 'plannedMachineName',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: machines,
    optionLabel: 'machinename',
    optionValue: 'machineid',
  },
  {
    name: 'programList',
    label: t('registeredJobOrders.programList'),
    field: 'programList',
  },
  {
    name: 'plannedStartTime',
    label: t('registeredJobOrders.scheduledStartTime'),
    field: 'plannedStartTime',
    filterable: true,
    filterType: 'date',
  },
]

const filters = ref<FilterableTableFilter[]>([])
const data = ref()
async function handleFilterSlotsUpdate(updatedValue) {
  filters.value = updatedValue
  data.value = await $fetch('/api/joborder/filtered-joborders', {
    method: 'post',
    body: updatedValue,
  })
  rows.value = data.value
  // filtersToKnex(externalFilterSlots.value, null)
}
</script>

<template>
  <div class="flex bg-yellow-600">
    <NavigationButton type="back" />
    <NavigationButton type="home" />
  </div>
  <FilterableTable
    :filters="filters"
    :columns="columns"
    :rows="rows"
    @update-filter-slots="handleFilterSlotsUpdate"
  />
</template>
