<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { QTableProps } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import { colors } from '~/shared/constants'

const { t, d } = useI18n()
const keycloak = useKeycloak()
function getDefaultFilter() {
  const now = new Date()
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
  return [
    {
      label: `${t('consumption.recordDate')} ${t('consumption.last12Hours')}`,
      field: 'recordDate',
      filterType: 'date',
      value: {
        from: twelveHoursAgo.toISOString(),
        to: now.toISOString(),
      },
    },
  ]
}
const { data: machines } = await useAuthFetch('/api/machine/machines')
const { data: dispensers } = await useAuthFetch('/api/settings/dispenser')
const modifiedDispensers = computed(() => dispensers.value.map(d => ({
  dispenserName: d.name,
  dispenserId: d.dispNo,
})))
const externalFilterSlots = useStorage('consumptionFilterSlots', getDefaultFilter(), sessionStorage)
const pagination = ref({ rowsPerPage: 25, page: 1, rowsNumber: 0 } as QTableProps['pagination'])
const visibleLoading = ref(true)
const consumptions = ref<any[]>([])

// Set default filter if empty or not set
onMounted(() => {
  if (!externalFilterSlots.value || externalFilterSlots.value.length === 0) {
    externalFilterSlots.value = getDefaultFilter()
  }
  console.log('externalFilterSlots', externalFilterSlots.value)
})

async function fetchData() {
  visibleLoading.value = true
  const response = await keycloak.fetch('/api/consumption/consumptions', {
    method: 'POST',
    body: { pagination: pagination.value, filters: externalFilterSlots.value },
  }).finally(() => visibleLoading.value = false)
  consumptions.value = response.rows
  pagination.value!.rowsNumber = response.count
}

watch(pagination, async () => {
  visibleLoading.value = true
  await fetchData()
  visibleLoading.value = false
})
// const mSelectOptions =
const columns = computed<Array<FilterableTableColumn>>(() => [
  {
    name: 'recordDate',
    label: t('consumption.recordDate'),
    field: 'recordDate',
    filterable: true,
    filterType: 'date',
    format: val => d(val, 'datetime'),
  },
  {
    name: 'jobOrderCode',
    label: t('joborder'),
    field: 'jobOrderCode',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialCode',
    label: t('materialCode'),
    field: 'materialCode',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'amount',
    label: t('consumption.amount'),
    field: 'amount',
    filterable: true,
    filterType: 'comparison',
    format: val => `${val?.toFixed(2)} mg`,
  },
  {
    name: 'recipeAmount',
    label: t('consumption.recipeAmount'),
    field: 'recipeAmount',
    filterable: true,
    filterType: 'comparison',
    format: val => `${val?.toFixed(2)} mg`,
  },
  {
    name: 'programNo',
    label: t('programNo'),
    field: 'programNo',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'dispenserName',
    label: t('consumption.dispenserName'),
    field: 'dispenserName',
    filterable: true,
    filterType: 'select',
    selectionOptions: modifiedDispensers.value,
    optionLabel: 'dispenserName',
    optionValue: 'dispenserId',
  },
  {
    name: 'machineName',
    label: t('consumption.machineName'),
    field: 'machineName',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machineName',
    optionValue: 'machineId',
  },
  {
    name: 'weighingType',
    label: t('consumption.weighingType'),
    field: 'weighingType',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: [
      { label: t('consumption.manual'), value: 'manuel' },
      { label: t('consumption.automatic'), value: 'automatic' },
      { label: t('consumption.correction'), value: 'correction' },
      { label: t('consumption.addition'), value: 'addition' },
    ],
    optionLabel: 'label',
    optionValue: 'value',
    format: (val, row) => {
      const types = []
      if (row.manuel)
        types.push(t('consumption.manual'))
      if (row.automatic)
        types.push(t('consumption.automatic'))
      if (row.correction)
        types.push(t('consumption.correction'))
      if (row.addition)
        types.push(t('consumption.addition'))
      return types.join(', ')
    },
  },
])

async function handleFilterSlotsUpdate(updatedValue: any) {
  externalFilterSlots.value = updatedValue
  await fetchData()
}
</script>

<template>
  <div class="outer-div">
    <div class="gap-5">
      <div v-if="visibleLoading" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2 z-10">
        <LoadingSpinner />
      </div>
      <div class="flex items-center ml-5 mt-4">
        <span class="text-size-4">
          {{ t('consumption.title') }}
        </span>
      </div>
      <div class="responsive-flex-container">
        <FilterableTable
          v-model:pagination="pagination"
          class="responsive-table"
          disable-search-filter
          :rows="consumptions"
          :columns="columns"
          dense
          :filter-slots="externalFilterSlots"
          @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
          @update-pagination="pgn => pagination = pgn"
        >
          <template #custombody="props">
            <q-tr
              :props="props"
              :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : ''"
            >
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.value }}
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </div>
    </div>
  </div>
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
  height: 80vh;
  padding: 1rem;
}

.responsive-table {
  width: 100%;
}

.outer-div {
  height: 100vh;
}
</style>
