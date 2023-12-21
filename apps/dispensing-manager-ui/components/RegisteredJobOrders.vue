<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import moment from 'moment'
import FilterableTable from 'ui/components/FilterableTable.vue'
import LoadingSpinner from 'ui/components/LoadingSpinner.vue'
import { onMounted } from 'vue'
import { colors } from '~/shared/constants'
import type { Column } from '~/shared/types'
import { navigateToPage } from '../shared/functions'

// Call fetchData when component is mounted.
// For this, we can use the onMounted hook from 'vue'

const { t } = useI18n()

const machines = ref([])

const joborders = ref()
const visibleLoading = ref(true)

// const externalFilterSlots = ref([])
// const tempFilterSlots = sessionStorage.getItem('filterSlots')
const externalFilterSlots = useStorage('filterSlots', [], sessionStorage)
// if (tempFilterSlots)
//   externalFilterSlots.value = JSON.parse(tempFilterSlots)

async function fetchData() {
  try {
    machines.value = await $fetch('/api/machine/machines') // FIXME: useFetc better $fetch may cause page to fail
    if (externalFilterSlots.value.length) {
      await handleFilterSlotsUpdate(externalFilterSlots.value)
    } else {
      joborders.value = await $fetch('/api/joborder/joborders')
    }
  } finally {
    visibleLoading.value = false
  }
}
onMounted(fetchData)

const columns = computed(() => [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo', filterable: true, filterType: 'comparison' },
  { name: 'plannedMachineName', label: t('plannedMachine'), field: 'plannedMachineName', filterable: true, filterType: 'select', selectionOptions: machines.value, optionLabel: 'machinename', optionValue: 'machineid' },
  { name: 'programList', label: t('registeredJobOrders.programList'), field: 'programList', format: val => val.slice(0, -1), filterable: true, filterType: 'includes' },
  { name: 'plannedStartTime', label: t('registeredJobOrders.scheduledStartTime'), field: 'plannedStartTime', filterable: true, filterType: 'date' },
] as Column[])

async function handleRowDblClick(row: any) {
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.correctionNo}`)
}

async function handleFilterSlotsUpdate(updatedValue: any) {
  externalFilterSlots.value = updatedValue
  joborders.value = await $fetch('/api/joborder/filtered-joborders', {
    method: 'post',
    body: externalFilterSlots.value,
  })
  // sessionStorage.setItem('filterSlots', JSON.stringify(externalFilterSlots.value))
  // filtersToKnex(externalFilterSlots.value, null)
}
</script>

<template>
  <div class="outer-div">
    <div class="header-class">
      <NavigationButton type="back" />
      &nbsp;&nbsp;
      {{ t('joborders') }}
      <span class="right-home">
        <NavigationButton type="settings" />
        <NavigationButton type="home" />
      </span>
    </div>
    <div class="gap-5">
      <div v-if="visibleLoading" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2 z-10">
        <LoadingSpinner />
      </div>
      <span class=" flex items-center ml-5 mt-4 text-size-4">
        {{ t('warnings.doubleClickToShowRecipe') }}
      </span>
      <div class="responsive-flex-container">
        <FilterableTable

          class="responsive-table"
          :rows="joborders"
          :columns="columns"
          :filter-slots="externalFilterSlots"
          :pagination="{ rowsPerPage: 20 }"
          @row-dblclick="row => handleRowDblClick(row)"
          @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
        >
          <template #custombody="props">
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
                  {{ moment(col.value).format('HH:m:ss DD/MM/YYYY') }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
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
.responsive-table{
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
