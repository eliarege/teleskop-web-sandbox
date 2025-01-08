<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { QTableProps } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'

// Call fetchData when component is mounted.
// For this, we can use the onMounted hook from 'vue'

const { t, d } = useI18n()
const { loading } = useQuasar()

const externalFilterSlots = useStorage('filterSlots', [], sessionStorage)
const { data: machines } = await useFetch('/api/machine')
const rowsNumber = await $fetch('/api/joborder/joborder-count')
const pagination = ref({ rowsPerPage: 50, page: 1, rowsNumber } as QTableProps['pagination'])

const joborders = ref([] as any[])
async function fetchData() {
  loading.show()
  const response = await $fetch<{ rows: any[], count: number }>('/api/joborder/joborders', {
    method: 'POST',
    body: { pagination: pagination.value, filters: externalFilterSlots.value },
  }).finally(() => {
    loading.hide()
  })
  joborders.value = response.rows
  pagination.value!.rowsNumber = response.count
}

watch(pagination, async () => {
  loading.show()
  await fetchData()
  loading.hide()
})

const columns = computed(() => [
  {
    name: 'joborder',
    label: t('joborderTable.jobOrder'),
    field: 'joborder',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'machineName',
    label: t('joborderTable.machineName'),
    field: 'machineName',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machineName',
    optionValue: 'machineId',
  },
  {
    name: 'startTime',
    label: t('joborderTable.startTime'),
    field: 'startTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'endTime',
    label: t('joborderTable.endTime'),
    field: 'endTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'cancelTime',
    label: t('joborderTable.cancelTime'),
    field: 'cancelTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'theoreticalProgramNoList',
    label: t('panels.theoricPrograms'),
    field: 'theoreticalProgramNoList',
    format: val => val.toString(),
  },
  {
    name: 'actualProgramNoList',
    label: t('panels.actualPrograms'),
    field: 'actualProgramNoList',
    format: val => val.toString(),
  },
] as FilterableTableColumn[])

const selectedRow = ref()

async function handleRowDblClick(batchkey: number) {
  await navigateTo(`/${batchkey}`)
}

onKeyStroke('Enter', () => {
  if (selectedRow.value) {
    handleRowDblClick(selectedRow.value)
  }
})

async function handleFilterSlotsUpdate(updatedValue: any) {
  externalFilterSlots.value = updatedValue
  await fetchData()
}
</script>

<template>
  <QPage>
    <div class="responsive-flex-container">
      <FilterableTable
        v-model:pagination="pagination"
        v-model:selected="selectedRow"
        class="responsive-table"
        disable-search-filter
        enable-key-strokes
        dense
        row-key="batchKey"
        :rows="joborders"
        :columns="columns"
        :filter-slots="externalFilterSlots"
        @row-dblclick="row => handleRowDblClick(row.batchKey)"
        @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
        @update-pagination="pgn => pagination = pgn"
      />
    </div>
  </QPage>
</template>

<style scoped>
@media (max-width: 768px) {
  .responsive-flex-container {
    display: block !important;
  }

  .responsive-table {
    width: 100%;
    margin-right: 0.2rem;
  }
}

.responsive-flex-container {
  display: flex;
  overflow-x: hidden;
  width: 100%;
  height: calc(100vh - 42px);
  padding: 1rem;
}
.responsive-table {
  width: 100%;
}
.right-home {
  position: absolute;
  right: 0;
}
</style>
