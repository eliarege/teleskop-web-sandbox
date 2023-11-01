<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Column, FilterSlot } from '../shared/types'
import { filtersToKnex } from '~/shared/functions'

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

const columns: Array<Column> = [
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

// const columns: Array<Column> = [
//   { name: 'name', label: 'Name', field: 'name', filterable: true, filterType: 'select', selectionOptions: ['Choose 1', 'Choose 2', 'Choose 3'] },
//   { name: 'calories', label: 'Calories', field: 'calories', filterable: true, filterType: 'multiselect', selectionOptions: ['Choose 1', 'Choose 2', 'Choose 3'] },
//   { name: 'fat', label: 'Fat (g)', field: 'fat', filterable: true, filterType: 'comparison' },
//   { name: 'carbs', label: 'Carbs (g)', field: 'carbs', filterable: true, filterType: 'date' },
//   { name: 'protein', label: 'Protein (g)', field: 'protein', filterable: true, filterType: 'boolean' },
//   { name: 'sodium', label: 'Sodium (mg)', field: 'sodium', filterable: true, filterType: 'boolean' },
// ]
// const rows = [
//   {
//     name: 'Frozen Yogurt',
//     calories: 159,
//     fat: 6.0,
//     carbs: 24,
//     protein: 4.0,
//     sodium: 87,
//     calcium: '14%',
//     iron: '1%',
//   },
//   {
//     name: 'Ice cream sandwich',
//     calories: 237,
//     fat: 9.0,
//     carbs: 37,
//     protein: 4.3,
//     sodium: 129,
//     calcium: '8%',
//     iron: '1%',
//   },
//   {
//     name: 'Eclair',
//     calories: 262,
//     fat: 16.0,
//     carbs: 23,
//     protein: 6.0,
//     sodium: 337,
//     calcium: '6%',
//     iron: '7%',
//   },
//   {
//     name: 'Cupcake',
//     calories: 305,
//     fat: 3.7,
//     carbs: 67,
//     protein: 4.3,
//     sodium: 413,
//     calcium: '3%',
//     iron: '8%',
//   },
//   {
//     name: 'Gingerbread',
//     calories: 356,
//     fat: 16.0,
//     carbs: 49,
//     protein: 3.9,
//     sodium: 327,
//     calcium: '7%',
//     iron: '16%',
//   },
//   {
//     name: 'Jelly bean',
//     calories: 375,
//     fat: 0.0,
//     carbs: 94,
//     protein: 0.0,
//     sodium: 50,
//     calcium: '0%',
//     iron: '0%',
//   },
//   {
//     name: 'Lollipop',
//     calories: 392,
//     fat: 0.2,
//     carbs: 98,
//     protein: 0,
//     sodium: 38,
//     calcium: '0%',
//     iron: '2%',
//   },
//   {
//     name: 'Honeycomb',
//     calories: 408,
//     fat: 3.2,
//     carbs: 87,
//     protein: 6.5,
//     sodium: 562,
//     calcium: '0%',
//     iron: '45%',
//   },
//   {
//     name: 'Donut',
//     calories: 452,
//     fat: 25.0,
//     carbs: 51,
//     protein: 4.9,
//     sodium: 326,
//     calcium: '2%',
//     iron: '22%',
//   },
//   {
//     name: 'KitKat',
//     calories: 518,
//     fat: 26.0,
//     carbs: 65,
//     protein: 7,
//     sodium: 54,
//     calcium: '12%',
//     iron: '6%',
//   },
// ]
const filters = ref<FilterSlot[]>([])
const data = ref()
async function handleFilterSlotsUpdate(updatedValue) {
  filters.value = updatedValue
  console.log(updatedValue)
  data.value = await $fetch('/api/joborder/filtered-joborders', {
    method: 'post',
    body: updatedValue,
  })
  console.log(data.value)
  rows.value = data.value
  // filtersToKnex(externalFilterSlots.value, null)
}
</script>

<template>
  <FilterableTable
    :filters="filters"
    :columns="columns"
    :rows="rows"
    @update-filter-slots="handleFilterSlotsUpdate"
  />
</template>
