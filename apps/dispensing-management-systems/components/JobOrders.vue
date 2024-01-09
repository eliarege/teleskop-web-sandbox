<script lang="ts" setup>
import type { QTableColumn } from 'quasar'
import type { JobOrder } from '~/shared/types'
import { useColorStore } from '~/store/Colors'

const { t } = useI18n()
const { dark } = useQuasar()
const route = useRoute()
const colorStore = useColorStore()

const { data: jobOrders } = await useFetch<JobOrder[]>(`/api/jobOrders/${route.params.id}`)

const columns: (QTableColumn<JobOrder>)[] = [
    {
      name: 'job_order',
      label: t('Job Order'),
      field: 'jobId',
      sortable: true,
      align: 'left'
    },
    {
      name: 'batch_correction_no',
      label: t('Batch Correction No'),
      field: 'batchCorrectionNo',
      sortable: true,
      align: 'left'
    },
    {
      name: 'machine_name',
      label: t('Machine Name'),
      field: 'machineName',
      sortable: true,
      align: 'left'
    },
    {
      name: 'tank_no',
      label: t('Tank No'),
      field: 'tankNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'program_no',
      label: t('Program No'),
      field: 'programNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'program_name',
      label: t('Program Name'),
      field: 'programName',
      sortable: true,
      align: 'left',
    },
    {
      name: 'step_no',
      label: t('Step No'),
      field: 'stepNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'recipe_type',
      label: t('Recipe Type'),
      field: 'recipeType',
      sortable: false,
      align: 'left',
    },
    {
      name: 'recipe_process_no',
      label: t('Recipe Process No'),
      field: 'recipeProcessNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'recipe_step_no',
      label: t('Recipe Step No'),
      field: 'recipeStepNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'status',
      label: t('Status'),
      field: 'status',
      sortable: false,
      align: 'left',
    }
]
function cellStyle(col: any, row: any, pageIndex: number, isDarkMode: boolean) {
  let style = 'background-color: '
  if (col.field === 'status') {
    style += colorStore.jobOrderStatusColors[row.status] || '#FFFFFF'
    style += '; color: white; font-weight: bolder; font-size: medium'
  }
  else if (isDarkMode) {
    if (pageIndex%2 === 0) {
      style += colorStore.darkJobOrderCellEven
    }
    else {
      style += colorStore.darkJobOrderCellOdd
    }
  }
  else {
    if (pageIndex%2 === 0) {
      style += colorStore.lightJobOrderCellEven
    }
    else {
      style += colorStore.lightJobOrderCellOdd
    }
  }
  return style
}
</script>

<template>
  <div class="q-pa-md outline-100 outline-red ml-9">
    <QTable
      :card-class="dark.isActive ? 'card-dark' : 'card-light'"
      :table-class="dark.isActive ? 'table-dark' : 'table-light'"
      :table-header-class="dark.isActive ? 'header-dark' : 'header-light'"
      :title="$t('Job Orders')"
      :rows="jobOrders"
      :columns="columns"
      separator="none"
      row-key="name"
    >
    <template #body-cell="props">
        <QTd
          :props="props"
          :style="cellStyle(props.col, props.row, props.pageIndex, dark.isActive)"
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
}
.header-dark th {
  font-weight: bold;
  padding-right: 5px;
  text-decoration: underline;
}
/* Light Theme Styles */
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
