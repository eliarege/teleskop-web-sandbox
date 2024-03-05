<script lang="ts" setup>
import { QTable } from 'quasar'
import type { QTableColumn } from 'quasar'
import MaterialRequests from './material/MaterialRequests.vue'
import WeighingInfo from './WeighingInfo.vue'
import type { JobOrder } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { cellStyle } from '~/shared/utils'

const { t } = useI18n()
const q = useQuasar()
const route = useRoute()
const colorStore = useColorStore()
const table = ref<QTable>()
const searchFilter = ref('')
const jobOrders = ref()
const selectedRow = ref<JobOrder | null>(null)
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
    sortable: true,
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
const buttonProps = ref([
  { name: 'materialRequests', label: t('MaterialRequests'), link: 'material', icon: 'science' },
  { name: 'recipeInfo', label: t('recipeFields.Info'), link: 'recipe', icon: 'description' },
  { name: 'weighingInfo', label: t('weighingFields.Info'), link: 'weighing', icon: 'balance' },
])
function onRowClick(row: JobOrder) {
  if (selectedRow.value === row)
    selectedRow.value = null
  else
    selectedRow.value = row
}
function onButtonClicked(link: string) {
  const jobOrder = selectedRow.value
  if (link === 'material') {
    q.dialog({
      component: MaterialRequests,
      componentProps: { jobOrder },
    })
  } else if (link === 'recipe') {
    navigateTo({
      path: '/recipe',
      query: {
        batchNo: jobOrder!.batchNo,
        correctionNo: jobOrder!.batchCorrectionNo,
        machineId: jobOrder!.machineId,
      },
    })
  } else if (link === 'weighing') {
    q.dialog({
      component: WeighingInfo,
      componentProps: { jobOrder },
    })
  }
}
const pagination = ref({ rowsPerPage: 50 })
watch((searchFilter), () => {
  // Workaround to wait for filteredSortedRows to update since it is not reactive
  setTimeout(() => {
    if (!table.value?.filteredSortedRows.includes(selectedRow.value))
      selectedRow.value = null
  }, 100)
})
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
      ref="table"
      :card-class="q.dark.isActive ? 'card-dark' : 'card-light'"
      :table-class="q.dark.isActive ? 'table-dark' : 'table-light'"
      :table-header-class="q.dark.isActive ? 'header-dark' : 'header-light'"
      :title="t('JobOrders')"
      :filter="searchFilter"
      :pagination
      :columns
      :rows="jobOrders"
      separator="cell"
      row-key="name"
    >
      <template #body="props">
        <QTr
          :props="props"
          style="cursor: pointer;"
          :class="{ 'selected-row': selectedRow === props.row }"
          @click="onRowClick(props.row)"
        >
          <QTd
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            :style="cellStyle(col, props.row, props.pageIndex, (selectedRow === props.row), q.dark.isActive, colorStore.colors)"
          >
            <span v-if="col.field === 'status'">
              {{ t(`statusCodes.${props.row.status}`) }}
            </span>
            <span v-else-if="col.field === 'recipeType'">
              {{ t(`recipeTypes.${props.row.recipeType}`) }}
            </span>
            <span v-else>
              {{ props.row[col.field] }}
            </span>
          </QTd>
        </QTr>
      </template>
    </QTable>
    <div
      v-if="selectedRow"
      :class="q.dark.isActive ? 'footer-buttons-joborder-dark' : 'footer-buttons-joborder-light'"
    >
      <QBtn
        v-for="button of buttonProps"
        :key="button.name"
        class="footer-button"
        outline
        @click="onButtonClicked(button.link)"
      >
        <QIcon
          class="button-icon"
          :name="button.icon"
        />
        <span class="button-text">
          {{ button.label }}
        </span>
      </QBtn>
    </div>
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
  max-height: 500px;
}
.table-light td {
  border: 1px solid grey;
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
.footer-buttons-joborder-light {
  background-color: white;
  z-index: 1;
  display: flex;
  position: sticky;
  bottom: 0;
  width: 100%;
  height: 5rem;
  justify-content: center;
}
/* Dark Theme Styles */
.table-dark td{
  border: 1px solid rgb(100,100,100);
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
.footer-buttons-joborder-dark {
  background-color: black;
  z-index: 1;
  display: flex;
  position: sticky;
  bottom: 0;
  width: 100%;
  height: 5rem;
  justify-content: center;
}
.footer-button{
  margin: 1rem;
  margin-bottom: 1rem;
  overflow: hidden;
}
.selected-row {
  position: sticky;
  top: 45px;
  bottom: 0px;
  z-index:1;
}
</style>
