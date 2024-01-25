<script setup lang="ts">
import { rowBGColorHandler } from '../shared/functions'
import { colors } from '~/shared/constants'
import type { Column } from '~/shared/types'

const props = defineProps({
  joborder: Number,
  plankey: Number,
})

const { t, d } = useI18n()

const joborder = ref(props.joborder)
const plankey = ref(props.plankey)
const machinename = ref()
const status = ref([
  { label: t('jobOrderLogs.newRequest'), status: 0 },
  { label: t('jobOrderLogs.forwardDistributor'), status: 1 },
  { label: t('jobOrderLogs.startedDistributingWeighing'), status: 2 },
  { label: t('jobOrderLogs.completedDistributingWeighing'), status: 3 },
  { label: t('jobOrderLogs.canceledDistributingWeighing'), status: 8 },
  { label: t('jobOrderLogs.priorityChange'), status: 4 },
  { label: t('jobOrderLogs.changedDistributor'), status: 10 },
  { label: t('jobOrderLogs.faultyOther'), status: null },
])

const logCols: Column[] = [
  { name: 'id', label: t('jobOrderLogs.id'), field: 'id', filterable: true, filterType: 'comparison' },
  // { name: 'machineName', label: t('machinename'), field: 'machineName' },
  // { name: 'joborder', label: t('jobOrderLogs.jobOrderCode'), field: 'joborder' },
  { name: 'programIndex', label: t('jobOrderLogs.programIndex'), field: 'programIndex', filterable: true, filterType: 'comparison' },
  { name: 'programNo', label: t('programNo'), field: 'programNo', filterable: true, filterType: 'comparison' },
  { name: 'programName', label: t('programName'), field: 'programName' },
  { name: 'recipeType', label: t('recipeType'), field: 'recipeType', filterable: true, filterType: 'select', selectionOptions: [{ label: t('chemical'), recipeType: 0 }, { label: t('dye'), recipeType: 1 }], optionValue: 'recipeType', optionLabel: 'label' },
  { name: 'requestIndex', label: t('jobOrderLogs.requestIndex'), field: 'requestIndex', filterable: true, filterType: 'comparison' },
  { name: 'status', label: t('status'), field: 'status', filterable: true, filterType: 'multiselect', selectionOptions: status.value, optionLabel: 'label', optionValue: 'status' },
  { name: 'time', label: t('jobOrderLogs.eventTime'), field: 'time', filterable: true, filterType: 'date' },
  { name: 'description', label: t('jobOrderLogs.description'), field: 'description' },
]

const logRows = ref()
await applyFilters([])
async function applyFilters(updatedValue: any) {
  const tempFilteredLogs = await $fetch('/api/logs/filtered-logs', {
    method: 'post',
    body: {
      filters: updatedValue,
      plankey: plankey.value,
    },
  })
  logRows.value = tempFilteredLogs
  machinename.value = logRows.value[0]?.machineName
}
</script>

<template>
  <q-card class="column">
    <div class="text-h6 ml-7 mt-3">
      {{ t('jobOrderLogs._') }} -
      <span v-if="joborder">
        {{ t('joborder') }} : {{ joborder }} -
      </span>
      <span v-if="machinename">
        {{ t('machinename') }} : {{ machinename }}
      </span>
    </div>
    <q-card-section class="col" style="display: flex;">
      <FilterableTable
        class="override-class-height"
        :columns="logCols"
        :rows="logRows"
        style="width: 100%; height: 100%;"
        @update-filter-slots="(evt) => applyFilters(evt)"
      >
        <template #custombody="log">
          <q-tr
            class="text-override-left"
            :style="log.rowIndex % 2 ? `background-color: ${colors.tableGray}` : ''"
          >
            <q-td
              v-for="row in log.cols"
              :key="row.name"
              :props="log"
              :style="rowBGColorHandler(row)"
            >
              <span v-if="row.field === 'status' && row.value !== null">
                {{ t(`statusCodes.${row.value}`) }}
              </span>
              <span v-else-if="row.field === 'recipeType' && row.value !== null">
                {{ t(`recipeTypes.${row.value}`) }}
              </span>
              <span v-else-if="row.field === 'time'">
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
.override-class-height :deep(.my-sticky-virtscroll-table-recipe) {
  height: 100%;
  margin: 1rem;
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
