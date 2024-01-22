<script setup lang="ts">
import type { Column } from 'ui/types/FilterableTable'
import FilterableTable from 'ui/components/FilterableTable.vue'

const { data: messages } = useLazyFetch('/api/machines/operator-messages', {
  default: () => [],
  method: 'POST',
  body: {},
})

const columns: Column[] = [
  {
    name: 'userId',
    label: 'User Id',
    field: 'userId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'operator',
    label: 'Operatör',
    field: 'operator',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineId',
    label: 'Makine',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'message',
    label: 'Mesaj',
    field: 'message',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'sentDate',
    label: 'Gönderim Zamanı',
    field: 'sentDate',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'runningBatchKey',
    label: 'Çalışan İş Emri',
    field: 'runningBatchKey',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

async function handleFilterSlotsUpdate(updatedValue) {
  messages.value = await $fetch('/api/machines/operator-messages', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card>
    <q-card-section>
      <FilterableTable
        :rows="messages"
        :columns="columns"
        class="overflow-y-auto h-160"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      />
    </q-card-section>
  </q-card>
</template>
