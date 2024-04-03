<script lang="ts" setup>
import ConfirmationDialog from './ConfirmationDialog.vue'
import MaterialRequests from './material/MaterialRequests.vue'
import WeighingInfo from './WeighingInfo.vue'
import BatchParametersInfo from './BatchParametersInfo.vue'
import type { Dispenser, JobOrder, Machine } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { cellStyle } from '~/shared/utils'
import { useDataStore } from '~/store/DataStore'
import { StatusCodes } from '~/shared/constants'

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const route = useRoute()
const dataStore = useDataStore()
const colorStore = useColorStore()
const filters = ref([])
const jobOrders = ref<JobOrder[]>([])
const selectedRow = ref<JobOrder | null>(null)
const dispensers = await dataStore.getDispensers()
const { data: machines } = useFetch<Machine[]>('/api/machines')
async function getJobOrders() {
  const dispenserId = route.query.dispenserId?.toString()
  if (dispenserId)
    jobOrders.value = await $fetch<JobOrder[]>(`/api/jobOrders`, { query: { dispenserId }, method: 'POST', body: { filters: filters.value } })
  else
    jobOrders.value = await $fetch<JobOrder[]>(`/api/jobOrders`, { method: 'POST', body: { filters: filters.value } })
}
getJobOrders()
const columns = [
  {
    name: 'batchNo',
    label: t('JobOrder'),
    field: 'batchNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'batchCorrectionNo',
    label: t('BatchCorrectionNo'),
    field: 'batchCorrectionNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'machineName',
    label: t('MachineName'),
    field: 'machineName',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machineName',
    optionValue: 'machineId',
  },
  {
    name: 'tankNo',
    label: t('TankNo'),
    field: 'tankNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'programNo',
    label: t('ProgramNo'),
    field: 'programNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'programName',
    label: t('ProgramName'),
    field: 'programName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'stepNo',
    label: t('StepNo'),
    field: 'stepNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'recipeType',
    label: t('RecipeType'),
    field: 'recipeType',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('recipeTypes.0'), recipeType: 0 },
      { label: t('recipeTypes.1'), recipeType: 1 },
    ],
    optionLabel: 'label',
    optionValue: 'recipeType',
  },
  {
    name: 'recipeProcessNo',
    label: t('RecipeProcessNo'),
    field: 'recipeProcessNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'recipeStepNo',
    label: t('RecipeStepNo'),
    field: 'recipeStepNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'status',
    label: t('Status'),
    field: 'status',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('statusCodes.0'), status: 0 },
      { label: t('statusCodes.1'), status: 1 },
      { label: t('statusCodes.2'), status: 2 },
      { label: t('statusCodes.3'), status: 3 },
      { label: t('statusCodes.4'), status: 4 },
      { label: t('statusCodes.8'), status: 8 },
      { label: t('statusCodes.10'), status: 10 },
    ],
    optionLabel: 'label',
    optionValue: 'status',
  },
]

const buttonProps = ref([
  { name: 'materialRequests', label: t('MaterialRequests'), link: 'material', icon: 'science' },
  { name: 'recipeInfo', label: t('recipeFields.Info'), link: 'recipe', icon: 'description' },
  { name: 'weighingInfo', label: t('weighingFields.Info'), link: 'weighing', icon: 'balance' },
  { name: 'parameters', label: t('batchPlanParameterFields.Title'), link: 'parameters', icon: 'format_list_numbered' },
])
function onRowClick(row: JobOrder, isContextMenu: boolean) {
  if (selectedRow.value === row && !isContextMenu)
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
  } else if (link === 'parameters') {
    q.dialog({
      component: BatchParametersInfo,
      componentProps: { jobOrder },
    })
  }
}
const pagination = ref({ rowsPerPage: 50 })
watch(() => route.query.dispenserId, (val) => {
  const dispenser = dataStore.getDispenser(Number(val))
  updateDispenser(dispenser)
  getJobOrders()
})
function updateDispenser(val: Dispenser | undefined) {
  selectedRow.value = null
  dataStore.selectedDispenser = val
  if (val) {
    dataStore.title = val.dispenserName
    navigateTo({
      path: `/jobOrders`,
      query: { dispenserId: `${val.dispenserId}` },
    })
  } else {
    dataStore.title = ''
    navigateTo({
      path: `/jobOrders`,
    })
  }
}
async function handleFilterSlotsUpdate(updatedFilters: any) {
  filters.value = updatedFilters
  getJobOrders()
  selectedRow.value = null
}
async function processRequest(status: string, order: JobOrder) {
  const showDialog = selectedRow.value!.status !== StatusCodes.requestCompleted && selectedRow.value!.status !== StatusCodes.canceled
  if (showDialog) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.AlreadyStartedWarning'),
        confirmBtn: {
          label: t('Confirm'),
          color: 'positive',
          icon: 'check',
        },
        cancelBtn: {
          label: t('Cancel'),
          icon: 'close',
        },
      },
    }).onOk(async () => {
      try {
        await handleFile(order, status)
        await $fetch('/api/jobOrders/set-status', { method: 'POST', query: { status: status === 'complete' ? 3 : 8, reqNo: order.jobId } })
        notifySuccess(t('Success'))
        getJobOrders()
      } catch (e) {
        notifyFail(t('Failed'))
      }
    })
  }
}
async function handleFile(data: any, status: any) {
  const dispenser = dataStore.getDispenser(data.dispenserId)
  if (dispenser?.dispenserBrandId === 1) // Eliar
  {
    const countInProgram = await $fetch('/api/jobOrders/step-count', {
      query: {
        batchNo: data.batchNo,
        correctionNo: data.batchCorrectionNo,
        recipeProcessNo: data.recipeProcessNo,
      },
    })
    const content = [
      status === 'retry' ? 1 : 8,
      data.priority,
      data.machineId,
      data.tankNo,
      data.batchNo,
      data.programNo,
      data.stepNo,
      data.recipeStepNo,
      countInProgram,
      data.recipeType,
      data.recipeProcessNo,
      status === 'retry' ? 1 : 0,
    ]
    await $fetch('/api/file/write-step', { method: 'POST', body: { content, reqFilePath: '/SiviKimyasal/req' } })
  }
}
</script>

<template>
  <div class="q-pa-md">
    <div class="flex-center mb-10">
      <div>
        <QSelect
          v-model="dataStore.selectedDispenser"
          borderless
          dense
          filled
          style="min-width: 30vw;"
          emit-value
          map-options
          options-dense
          option-label="dispenserName"
          :options="dispensers"
          @update:model-value="updateDispenser"
        />
      </div>
    </div>
    <FilterableTable
      :rows="jobOrders"
      :columns
      class="h-160 custom-filterable-table"
      :is-virtual-scroll="false"
      :pagination
      @update-filter-slots="handleFilterSlotsUpdate"
    >
      <template #custombody="props">
        <QTr
          :props="props"
          style="cursor: pointer;"
          :class="{ 'selected-row': selectedRow === props.row }"
          @click="onRowClick(props.row, false)"
          @contextmenu="onRowClick(props.row, true)"
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
            <QMenu
              touch-position
              context-menu
            >
              <QList>
                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('retry', selectedRow)
                  "
                >
                  <QItemSection>{{ t('jobOrderActions.Retry') }}</QItemSection>
                </QItem>
                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('cancel', selectedRow)
                  "
                >
                  <QItemSection>{{ t('jobOrderActions.Cancel') }}</QItemSection>
                </QItem>
                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('complete', selectedRow)
                  "
                >
                  <QItemSection>{{ t('jobOrderActions.Complete') }}</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QTd>
        </QTr>
      </template>
    </FilterableTable>
    <div
      v-if="selectedRow"
      class="footer-buttons-joborder"
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

<style scoped>
.footer-buttons-joborder {
  background-color: white;
  z-index: 1;
  display: flex;
  position: sticky;
  bottom: 0;
  width: 100%;
  height: 5rem;
  justify-content: center;
}
.body--dark .footer-buttons-joborder {
  background-color: var(--q-dark);
}
.footer-button {
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
.custom-filterable-table {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>
