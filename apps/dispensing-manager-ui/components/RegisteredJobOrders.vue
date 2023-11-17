<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'
import LoadingSpinner from 'ui/components/LoadingSpinner.vue'
import moment from 'moment'
import { filtersToKnex, navigateToPage, textAlignOverride } from '../shared/functions'
import { rows } from '../shared/constants'
import type { Column } from '~/shared/types'

// Call fetchData when component is mounted.
// For this, we can use the onMounted hook from 'vue'

const { t } = useI18n()

const joborderInput = ref()
const date = ref({ from: '', to: '' })

const selectedMachine = ref()
const machines = ref([])

const joborders = ref()
const visibleLoading = ref(true)
async function fetchData() {
  try {
    machines.value = await $fetch('/api/machine/machines') // FIXME: useFetc better $fetch may cause page to fail
    joborders.value = await $fetch('/api/joborder/joborders')
  } finally {
    visibleLoading.value = false
  }
}
onMounted(fetchData)

const columns = computed(() => [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo', filterable: true, filterType: 'comparison' },
  { name: 'plannedMachineName', label: t('plannedMachine'), field: 'plannedMachineName', filterable: true, filterType: 'select', selectionOptions: machines.value, optionLabel: 'machinename', optionValue: 'machineid' },
  { name: 'programList', label: t('registeredJobOrders.programList'), field: 'programList', filterable: true, filterType: 'includes' },
  { name: 'plannedStartTime', label: t('registeredJobOrders.scheduledStartTime'), field: 'plannedStartTime', filterable: true, filterType: 'date' },
])
const noFilterSpec = ref(true)

async function request() {
  let query = '/api/joborder/filtered-joborders?'
  if (selectedMachine.value?.machineid)
    query += `machineid=${selectedMachine.value.machineid}&`
  if (joborderInput.value)
    query += `joborder=${joborderInput.value}&`
  if (date.value.from && date.value.to)
    query += `startdate=${date.value.from}&enddate=${date.value.to}&`
  const tempMachines = await $fetch(query)
  joborders.value = tempMachines
}

async function handleRowDblClick(row) {
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.correctionNo}`)
}

const externalFilterSlots = ref([])
async function handleFilterSlotsUpdate(updatedValue) {
  externalFilterSlots.value = updatedValue
  joborders.value = await $fetch('/api/joborder/filtered-joborders', {
    method: 'post',
    body: externalFilterSlots.value,
  })

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
          :pagination="{ rowsPerPage: 20 }"
          @row-dblclick="row => handleRowDblClick(row)"
          @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
        >
          <template #custombody="props">
            <q-tr :props="props" style="cursor: pointer;">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @dblclick="handleRowDblClick(props.row)"
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
  background-color: rgb(70, 56, 141);
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
