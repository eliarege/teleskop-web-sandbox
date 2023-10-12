<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import moment from 'moment'

const props = defineProps({
  joborder: Number,
  plankey: Number,
})

const { t } = useI18n()

const joborder = ref(props.joborder)
const plankey = ref(props.plankey)
const machinename = ref()
const logCols = [
  { name: 'id', label: t('jobOrderLogs.id'), field: 'id' },
  // { name: 'machineName', label: t('machinename'), field: 'machineName' },
  // { name: 'joborder', label: t('jobOrderLogs.jobOrderCode'), field: 'joborder' },
  { name: 'programIndex', label: t('jobOrderLogs.programIndex'), field: 'programIndex' },
  { name: 'programNo', label: t('programNo'), field: 'programNo' },
  { name: 'programName', label: t('programName'), field: 'programName' },
  { name: 'recipeType', label: t('recipeType'), field: 'recipeType' },
  { name: 'requestIndex', label: t('jobOrderLogs.requestIndex'), field: 'requestIndex' },
  { name: 'status', label: t('status'), field: 'status' },
  { name: 'time', label: t('jobOrderLogs.eventTime'), field: 'time' },
  { name: 'description', label: t('jobOrderLogs.description'), field: 'description' },
]
const checkboxesStatus = ref([
  { value: true, label: t('jobOrderLogs.newRequest'), code: 0 },
  { value: true, label: t('jobOrderLogs.forwardDistributor'), code: 1 },
  { value: true, label: t('jobOrderLogs.startedDistributingWeighing'), code: 2 },
  { value: true, label: t('jobOrderLogs.completedDistributingWeighing'), code: 3 },
  { value: true, label: t('jobOrderLogs.canceledDistributingWeighing'), code: 8 },
  { value: true, label: t('jobOrderLogs.priorityChange'), code: 4 },
  { value: true, label: t('jobOrderLogs.changedDistributor'), code: 10 },
  { value: true, label: t('jobOrderLogs.faultyOther'), code: null },
])

const checkboxesRecipeType = ref([
  { value: true, label: t('chemical'), code: 0 },
  { value: true, label: t('dye'), code: 1 },
])

const checkboxesProgramIndex = ref([
  { value: true, label: 1, code: 1 },
  { value: true, label: 2, code: 2 },
  { value: true, label: t('jobOrderLogs.other'), code: 0 },
])

const selectedOrderingMethod = ref()
const selectedSortingMethod = ref()

const orderOptins = [
  { value: 'EVENTTIME', label: t('jobOrderLogs.timeOrder') },
  // { value: 'recipeStep', label: t('jobOrderLogs.recipeStepOrder') },
]
const sortOptions = [
  { value: 'asc', label: t('jobOrderLogs.asc') },
  { value: 'desc', label: t('jobOrderLogs.desc') },
]
const showFilters = ref(true)

const logRows = ref()
await applyFilters()
async function applyFilters() {
  const tempFilteredLogs = await $fetch('/api/logs/filtered-logs', {
    method: 'post',
    body: {
      status: checkboxesStatus.value,
      recipeType: checkboxesRecipeType.value,
      programIndex: checkboxesProgramIndex.value,
      // sortBy: selectedOrderingMethod.value.value,
      // direction: selectedSortingMethod.value.value,
      plankey: plankey.value,
    },
  })
  logRows.value = tempFilteredLogs
  console.log(logRows.value)
  machinename.value = logRows.value[0].machineName
}
</script>

<template>
  <q-card class="column">
    <div class="text-h6 ml-7 mt-3">
      {{ t('jobOrderLogs.a') }} -
      <span v-if="joborder">
        {{ t('joborder') }} : {{ joborder }} -
      </span>
      <span v-if="machinename">
        {{ t('machinename') }} : {{ machinename }}
      </span>
    </div>
    <div v-if="showFilters">
      <q-card-section class="ml-5">
        <div class="flex gap-5">
          <div class="flex flex-col filter-divs" style="width: 15%;">
            <span class="filter-header">
              - {{ t('status') }}
            </span>
            <label
              v-for="(element, index) in checkboxesStatus"
              :key="index"
              style="display: flex; align-items: center;"
            >
              <input
                v-model="element.value"
                type="checkbox"
                style="width: 1rem; height: 1rem; margin-right: 5px;"
              >
              {{ element.label }}
            </label>
          </div>

          <div class="flex flex-col filter-divs" style="width: 15%;">
            <span class="filter-header">
              - {{ t('recipeType') }}
            </span>
            <label
              v-for="(element, index) in checkboxesRecipeType"
              :key="index"
              style="display: flex; align-items: center;"
            >
              <input
                v-model="element.value"
                type="checkbox"
                style="width: 1rem; height: 1rem; margin-right: 5px;"
              >
              {{ element.label }}
            </label>
          </div>

          <div class="flex flex-col filter-divs" style="width: 15%;">
            <span class="filter-header">
              - {{ t('jobOrderLogs.programIndex') }}
            </span>
            <label
              v-for="(element, index) in checkboxesProgramIndex"
              :key="index"
              style="display: flex; align-items: center;"
            >
              <input
                v-model="element.value"
                type="checkbox"
                style="width: 1rem; height: 1rem; margin-right: 5px;"
              >
              {{ element.label }}
            </label>
          </div>
          <div class="flex flex-col gap-5 filter-divs" style="width: 15%;">
            <span class="filter-header">
              - {{ t('jobOrderLogs.arrangement') }}
            </span>
            <q-select
              v-model="selectedOrderingMethod"
              filled
              clearable
              :label="t('jobOrderLogs.arrangementCriterion')"
              :options="orderOptins"
              option-label="label"
              option-value="value"
            />
            <q-select
              v-model="selectedSortingMethod"
              filled
              clearable
              :label="t('jobOrderLogs.arrangementSort')"
              :options="sortOptions"
              option-label="label"
              option-value="value"
            />
          </div>
        </div>
        <div class="flex-center">
          <q-btn
            color="primary"
            icon="sort"
            :label="t('apply')"
            class="px-10"
            @click="applyFilters()"
          />
        </div>
      </q-card-section>
    </div>
    <q-btn
      :label="showFilters ? t('jobOrderLogs.hideFilters') : t('jobOrderLogs.showFilters')"
      :icon="showFilters ? 'filter_alt' : 'filter_alt_off'"
      class="ml-10"
      color="primary"
      style="width: 20%; font-weight: 500;"
      @click="showFilters = !showFilters"
    />
    <q-card-section class="col" style="display: flex;">
      <q-table
        class="text-override-left ml-5 mr-5 my-sticky-virtscroll-table-recipe "
        :columns="logCols"
        :rows="logRows"
        :rows-per-page-options="[0]"
        style="width: 100%; height: 100%;"
        virtual-scroll
        flat
        bordered
        :virtual-scroll-sticky-size-start="48"
      >
        <template #body="log">
          <q-tr>
            <q-td
              v-for="row in log.cols"
              :key="row.name"
              :props="log"
            >
              <span v-if="row.field === 'status'">
                {{ t(`statusCodes.${row.value}`) }}
              </span>
              <span v-else-if="row.field === 'recipeType'">
                {{ t(`recipeTypes.${row.value}`) }}
              </span>
              <span v-else-if="row.field === 'time'">
                {{ moment(row.value).format('DD-MM-YYYY hh:m:ss') }}
              </span>
              <span v-else>
                {{ row.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>

    <q-card-actions align="right" style="position:relative;">
      <q-btn
        v-close-popup
        class="m-2"
        color="secondary"
        flat
        :label="t('close')"
        style="font-size: medium;"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.filter-divs {
  height: 14rem;
}

.filter-header {
  font-weight: 600;
  font-size: medium;
  margin-left: 5px;
  margin-bottom: 5px;
}
.custom-checkboxes :deep(.q-checkbox__inner) {
    font-size: 60px;
    width: 2rem;
    min-width: 2rem;
    height: 2rem;
    outline: 0;
    border-radius: 50%;
}
.custom-checkboxes :deep(.q-checkbox__bg) {
    top: 20%;
    left: 20%;
    width: 60%;
    height: 60%;
    border: 2px solid currentColor;
    border-radius: 2px;
}
.my-sticky-virtscroll-table-recipe {
  height: 410px;
}

.my-sticky-virtscroll-table-recipe :deep(.q-table__top),
.my-sticky-virtscroll-table-recipe :deep(.q-table__bottom),
.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  background-color: #dddddd;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr th) {
  position: sticky;
  z-index: 1;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:last-child th) {
  top: 48px;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  top: 0;
}

.my-sticky-virtscroll-table-recipe :deep(tbody) {
  scroll-margin-top: 48px;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
</style>
