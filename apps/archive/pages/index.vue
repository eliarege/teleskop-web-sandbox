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
const pagination = ref({ rowsPerPage: 50, page: 1 } as QTableProps['pagination'])

const jobOrders = ref([] as any[])
async function fetchData() {
  loading.show()
  const response = await $fetch<{ rows: any[], count: number }>('/api/job-order', {
    method: 'POST',
    body: { pagination: pagination.value, filters: externalFilterSlots.value },
  }).finally(() => {
    loading.hide()
  })
  jobOrders.value = response.rows
  pagination.value!.rowsNumber = response.count
}

watch(pagination, async () => {
  loading.show()
  await fetchData()
  loading.hide()
})

const { data: theoreticalProgramNos } = await useFetch<number[]>('/api/theoretical-programs')

const columns = computed(() => [
  {
    name: 'batchStatus',
    label: t('jobOrderTable.batchStatus._'),
    field: 'batchStatus',
    filterable: true,
    filterType: 'boolean',
    trueLabel: t('jobOrderTable.batchStatus.active'),
    falseLabel: t('jobOrderTable.batchStatus.completed'),
  },
  {
    name: 'jobOrder',
    label: t('jobOrderTable.jobOrder'),
    field: 'jobOrder',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineName',
    label: t('jobOrderTable.machineName'),
    field: 'machineName',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machineName',
    optionValue: 'machineId',
  },
  {
    name: 'startTime',
    label: t('jobOrderTable.startTime'),
    field: 'startTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'endTime',
    label: t('jobOrderTable.endTime'),
    field: 'endTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'cancelTime',
    label: t('jobOrderTable.cancelTime'),
    field: 'cancelTime',
    filterable: true,
    filterType: 'date',
    format: val => val ? d(val, 'datetime') : '',
  },
  {
    name: 'theoreticalProgramNoList',
    label: t('panels.theoreticalPrograms'),
    field: 'theoreticalProgramNoList',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: theoreticalProgramNos.value || [],
    format: val => val.join(', '),
  },
  {
    name: 'actualProgramNoList',
    label: t('panels.actualPrograms'),
    field: 'actualProgramNoList',
    format: val => val.join(', '),
  },
] as FilterableTableColumn[])

const selectedRow = ref()

async function handleRowDblClick(batchkey: number) {
  await navigateTo(`/${batchkey}`)
}

onKeyStroke('Enter', () => {
  if (selectedRow.value) {
    handleRowDblClick(selectedRow.value.batchKey)
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
        :rows="jobOrders"
        :columns="columns"
        :filter-slots="externalFilterSlots"
        @row-dblclick="row => handleRowDblClick(row.batchKey)"
        @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
        @update-pagination="pgn => pagination = pgn"
      >
        <template #body-cell-batchStatus="props">
          <q-icon
            :name="props.value ? 'directions_run' : 'check'"
            :color="props.value ? 'positive' : 'grey'"
            size="1.5rem"
          >
            <q-tooltip :delay="500">
              {{ props.value ? t('jobOrderTable.batchStatus.active') : t('jobOrderTable.batchStatus.completed') }}
            </q-tooltip>
          </q-icon>
        </template>
      </FilterableTable>
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
