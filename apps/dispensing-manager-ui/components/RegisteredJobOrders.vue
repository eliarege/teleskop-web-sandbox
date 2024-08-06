<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { QTableProps } from 'quasar'
import { LoadingSpinner } from '@teleskop/ui'
import { onMounted } from 'vue'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import { navigateToPage } from '../shared/functions'
import { colors } from '~/shared/constants'

// Call fetchData when component is mounted.
// For this, we can use the onMounted hook from 'vue'

const { t, d } = useI18n()
const keycloak = useKeycloak()

const externalFilterSlots = useStorage('filterSlots', [], sessionStorage)
// const machines = ref([])
const { data: machines } = await useAuthFetch('/api/machine/machines')
const rowsNumber = await keycloak.fetch('/api/joborder/joborder-count')
const pagination = ref({ rowsPerPage: 10, page: 1, rowsNumber } as QTableProps['pagination'])
const visibleLoading = ref(true)
const joborders = ref([])
async function fetchData() {
  visibleLoading.value = true
  const response = await keycloak.fetch('/api/joborder/joborders', {
    method: 'POST',
    body: { pagination: pagination.value, filters: externalFilterSlots.value },
  }).finally(() => visibleLoading.value = false)
  joborders.value = response.rows
  pagination.value!.rowsNumber = response.count
}

watch(pagination, async (newPagination) => {
  visibleLoading.value = true
  await fetchData()
  visibleLoading.value = false
})
// onMounted(async () => await fetchData(pagination.value, externalFilterSlots.value))

const columns = computed(() => [
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
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machinename',
    optionValue: 'machineid',
  },
  {
    name: 'programList',
    label: t('registeredJobOrders.programList'),
    field: 'programList',
    format: val => val.slice(0, -1),
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'plannedStartTime',
    label: t('registeredJobOrders.scheduledStartTime'),
    field: 'plannedStartTime',
    filterable: true,
    filterType: 'date',
    format: val => d(val, 'datetime'),
  },
] as FilterableTableColumn[])

async function handleRowDblClick(row: any) {
  await navigateToPage(`recipe?joborder=${row.joborder}&correctionNo=${row.correctionNo}`)
}

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
      <span class=" flex items-center ml-5 mt-4 text-size-4">
        {{ t('warnings.doubleClickToShowRecipe') }}
      </span>
      <div class="responsive-flex-container">
        <FilterableTable
          v-model:pagination="pagination"
          class="responsive-table"
          disable-search-filter
          :rows="joborders"
          :columns="columns"
          :filter-slots="externalFilterSlots"
          @row-dblclick="row => handleRowDblClick(row)"
          @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
          @update-pagination="pgn => pagination = pgn"
        >
          <!-- <template #custombody="props">
            <q-tr
              :props="props"
              style="cursor: pointer;"
              :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
            >
              <q-td
                v-for="(col) in props.cols"
                :key="col.name"
                :props="props"
                @click="handleRowDblClick(props.row)"
              >
                <span v-if="col.field === 'plannedStartTime'">
                  {{ d(col.value, 'datetime') }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
          </template> -->
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
.header-class {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  height: 3rem;
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
.right-home {
  position: absolute;
  right: 0;
}

.footer-buttons {
  font-size: medium;
  color: blue;
  background-color: rgb(236, 236, 236);
  height: 10%;
  width: 100%;
  position: absolute;
  bottom: 0px;
  right: 0px;
  display: flex;
  align-items: center;
}
</style>
