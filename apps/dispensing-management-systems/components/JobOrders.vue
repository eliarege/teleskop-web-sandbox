<script lang="ts" setup>
import type { QTableColumn } from 'quasar'
import MaterialRequests from './MaterialRequests.vue'
import type { JobOrder } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { cellStyle } from '~/shared/utils'

const { t } = useI18n()
const q = useQuasar()
const route = useRoute()
const colorStore = useColorStore()
const searchFilter = ref('')
const jobOrders = ref()

getJobOrders()
async function getJobOrders() {
  jobOrders.value = await $fetch<JobOrder[]>(`/api/jobOrders?dispenserId=${route.query.dispenserId}`)
}
const columns: (QTableColumn<JobOrder>)[] = [
  {
    name: 'job_order',
    label: t('JobOrder'),
    field: 'batchNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'batch_correction_no',
    label: t('BatchCorrectionNo'),
    field: 'batchCorrectionNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'machine_name',
    label: t('MachineName'),
    field: 'machineName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'tank_no',
    label: t('TankNo'),
    field: 'tankNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'program_no',
    label: t('ProgramNo'),
    field: 'programNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'program_name',
    label: t('ProgramName'),
    field: 'programName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'step_no',
    label: t('StepNo'),
    field: 'stepNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'recipe_type',
    label: t('RecipeType'),
    field: 'recipeType',
    sortable: false,
    align: 'left',
  },
  {
    name: 'recipe_process_no',
    label: t('RecipeProcessNo'),
    field: 'recipeProcessNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'recipe_step_no',
    label: t('RecipeStepNo'),
    field: 'recipeStepNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'status',
    label: t('Status'),
    field: 'status',
    sortable: true,
    align: 'left',
  },
]

function onRowClick(_event: Event, row: JobOrder) {
  q.dialog({
    component: MaterialRequests,
    componentProps: { jobOrder: row },
  })
}
const pagination = ref({ rowsPerPage: 50 })
</script>

<template>
  <div class="q-pa-md ml-9">
    <div class="flex-center">
      <QInput
        v-model="searchFilter"
        :label="t('Search')"
        class="mb-10 w-50%"
      >
        <template #prepend>
          <QIcon name="search" />
        </template>
      </QInput>
    </div>
    <QTable
      :card-class="q.dark.isActive ? 'card-dark' : 'card-light'"
      :table-class="q.dark.isActive ? 'table-dark' : 'table-light'"
      :table-header-class="q.dark.isActive ? 'header-dark' : 'header-light'"
      :title="t('JobOrders')"
      :filter="searchFilter"
      :pagination
      :columns
      :rows="jobOrders"
      separator="none"
      row-key="name"
      @row-click="onRowClick"
    >
      <template #body-cell="props">
        <QTd
          :props="props"
          :style="cellStyle(props.col, props.row, props.pageIndex, q.dark.isActive, colorStore.colors)"
        >
          <span v-if="props.col.field === 'status'">
            {{ t(`statusCodes.${props.row.status}`) }}
          </span>
          <span v-else-if="props.col.field === 'recipeType'">
            {{ t(`recipeTypes.${props.row.recipeType}`) }}
          </span>
          <span v-else>
            {{ props.value }}
          </span>
        </QTd>
      </template>
    </QTable>
  </div>
</template>

<style>
.card-light {
  background-color: white;
  text-decoration-color: brown;
}
.card-dark {
  background-color: rgb(43, 41, 41);
  text-decoration-color: green;
}

.header-light th {
  font-weight: bold;
  padding-right: 5px;
  text-decoration: underline;
  position: sticky;
  background-color: var(--q-primary);
  top: 0px;
  z-index: 1;
}
.header-dark th {
  font-weight: bold;
  padding-right: 5px;
  text-decoration: underline;
  position: sticky;
  background-color: var(--q-dark);
  top: 0px;
  z-index: 1;
}
/* Light Theme Styles */
.table-dark, .table-light {
  max-height: 400px;
}
.table-light td {
  border: 1px solid blue;
  border-right: none;
  border-bottom: none;
}

.table-light th:last-child,
.table-light td:last-child {
  border-right: none;
}

.table-light tbody tr:last-child th,
.table-light tbody tr:last-child td {
  border-bottom: none;
  border-right: none;
}
.table-light th:first-child,
.table-light td:first-child {
  border-left: none;
}
.table-light .status-cell {
  background-color: red;
}
/* Dark Theme Styles */
.table-dark td{
  border: 1px solid darkred;
  border-right: none;
  border-bottom: none;
}
.table-dark th:last-child,
.table-dark td:last-child {
  border-right: none;
}

.table-dark tbody tr:last-child th,
.table-dark tbody tr:last-child td {
  border-bottom: none;
  border-right: none;
}
.table-dark th:first-child,
.table-dark td:first-child {
  border-left: none;
}
.q-table__control {
  justify-content: center;
  flex: content;
}
</style>
