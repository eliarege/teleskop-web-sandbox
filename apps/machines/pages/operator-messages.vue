<script setup lang="ts">
import type { FilterableTableColumn } from 'nuxt-base'

const { t, d } = useI18n()

const { data: messages } = useLazyFetch('/api/machines/operator-messages', {
  default: () => [],
  method: 'POST',
  body: {},
})

const columns = computed(() => ([
  {
    name: 'userId',
    label: t('userId'),
    field: 'userId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'operator',
    label: t('operator'),
    field: 'operator',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineId',
    label: `${t('machine')} ID`,
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'message',
    label: t('message'),
    field: 'message',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'sentDate',
    label: t('sentDate'),
    field: 'sentDate',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'runningBatchKey',
    label: t('runningBatchKey'),
    field: 'runningBatchKey',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

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
      >
        <template #custombody="fails">
          <q-tr>
            <q-td
              v-for="row in fails.cols"
              :key="row"
            >
              <span v-if="row.field === 'sentDate'">
                {{ d(row.value, 'datetime') }}
              </span>
              <span v-else>
                {{ row.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </FilterableTable>
    </q-card-section>
  </q-card>
</template>
