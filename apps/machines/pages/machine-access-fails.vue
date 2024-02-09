<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'

const { t, d } = useI18n()

const accessFailOptions = ref([
  { label: t('noNetworkConnection'), eventCode: 0 },
  { label: t('noTeleskopCommunication'), eventCode: 1 },
  { label: t('wrongControllerDate'), eventCode: 2 },
])

const columns: Column[] = [
  {
    name: 'machineCode',
    label: t('machine'),
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'eventCode',
    label: t('cause'),
    field: 'eventCode',
    align: 'left',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: accessFailOptions.value,
    optionLabel: 'label',
    optionValue: 'eventCode',
  },
  {
    name: 'eventStart',
    label: t('startDate'),
    field: 'eventStart',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },

  {
    name: 'eventEnd',
    label: t('endDate'),
    field: 'eventEnd',
    align: 'left',
    filterable: true,
    filterType: 'date',
  },
]

const { data: fails } = useLazyFetch('/api/machine-access-fails/machine-access-fails', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleFilterSlotsUpdate(updatedValue) {
  fails.value = await $fetch('/api/machine-access-fails/machine-access-fails', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <FilterableTable
    :rows="fails"
    :columns="columns"
    class="overflow-y-auto	h-220"
    @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
  >
    <template #custombody="fails">
      <q-tr>
        <q-td
          v-for="row in fails.cols"
          :key="row"
        >
          <span v-if="row.field === 'eventCode'">
            {{ accessFailOptions.find(o => o.eventCode === row.value)?.label }}
          </span>

          <span v-else-if="row.field === 'eventStart'">
            {{ d(row.value, 'datetime') }}
          </span>
          <span v-else-if="row.field === 'eventEnd'">
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
