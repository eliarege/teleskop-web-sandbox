<script lang="ts" setup>
import type { QTableProps } from 'quasar'
import { withBase } from 'ufo'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import BatchParametersInfoDialog from '../BatchParametersInfoDialog.vue'
import JobOrderBatchCreateDialog from './JobOrderBatchCreateDialog.vue'
import JobOrderContinueCreateDialog from './JobOrderContinueCreateDialog.vue'
import JobOrderContinueInfoDialog from './JobOrderContinueInfoDialog.vue'
import type { Dispenser, JobOrder, Machine } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { useDataStore } from '~/store/DataStore'
import { StatusCodes } from '~/shared/constants'
import { useStateStore } from '~/store/State'

const { t, d } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const route = useRoute()
const dataStore = useDataStore()
const stateStore = useStateStore()
const colorStore = useColorStore()
const filters = ref()
const jobOrders = ref<JobOrder[]>([])
const selectedRow = ref<JobOrder | null>(null)
const dispensers = await dataStore.getDispensers()
const dispenserSelections = [{ dispenserId: -1, dispenserName: t('AllDispensers') }, ...dispensers]
const selectedDispenser = ref(dataStore.selectedDispenser ? dataStore.selectedDispenser : dispenserSelections[0])
const { data: machines } = await useFetch<Machine[]>('/api/machines')
function formatProgramNames(programNames: string[] | null | undefined) {
  if (!programNames || !Array.isArray(programNames) || programNames.length === 0)
    return ''
  return programNames.join(', ')
}
async function getJobOrders() {
  const dispenserId = route.query.dispenserId?.toString()
  jobOrders.value = await $fetch<JobOrder[]>(`/api/job-orders`, {
    method: 'POST',
    body: { filters: filters.value },
    query: dispenserId ? { dispenserId } : undefined,
  })
  dataStore.newJobOrders = false
}
handleFilterSlotsUpdate(stateStore.jobOrderFilters)
watch(() => dataStore.newJobOrders, (orders) => {
  if (orders) {
    getJobOrders()
  }
})

const columns = ref([
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
    name: 'programNames',
    label: t('Programs'),
    field: 'programNames',
    align: 'left',
    filterable: false,
    filterType: 'includes',
    format: (val: any, row: any) => formatProgramNames(row?.programNames),
  },
  {
    name: 'recipeName',
    label: t('Recipe'),
    field: 'recipeName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'colorName',
    label: t('jobOrderParams.ColorName'),
    field: 'colorName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'customerName',
    label: t('customerFields.Name'),
    field: 'customerName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'workOrder',
    label: t('jobOrderParams.OrderNo'),
    field: 'workOrder',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'ASNo',
    label: t('jobOrderParams.ASNo'),
    field: 'ASNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'yarn',
    label: t('jobOrderParams.Yarn'),
    field: 'yarn',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'fabricType',
    label: t('fabricTypeFields.Name'),
    field: 'fabricType',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'requestTime',
    label: t('jobOrderParams.StartDate'),
    field: 'requestTime',
    align: 'left',
    filterable: true,
    filterType: 'date',
    format: (val: any) => val ? d(new Date(val), 'datetime') : '',
  },
  /*
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
  */
  /*
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
  */
])

// Filter columns based on jobOrderPrefs
const filteredColumns = computed(() => {
  const prefs = stateStore.jobOrderPrefs.show
  return columns.value.filter((col) => {
    if (col.field === 'ASNo' && !prefs.ASNo)
      return false
    if (col.field === 'yarn' && !prefs.yarn)
      return false
    if (col.field === 'workOrder' && !prefs.orderNo)
      return false
    return true
  })
})

const buttonProps = ref([
  { name: 'recipeInfo', label: t('recipeFields.Info'), link: 'recipe', icon: 'description', batch: true, continue: true },
  { name: 'parameters', label: t('batchPlanParameterFields.Title'), link: 'parameters', icon: 'format_list_numbered', batch: true, continue: false },
  { name: 'info', label: t('Info'), link: 'info', icon: 'info', batch: false, continue: true },
  { name: 'reuseRequest', label: t('ReuseRequest'), link: 'reuse', icon: 'restart_alt', batch: true, continue: true },
])
const filteredButtonProps = computed(() => {
  return buttonProps.value.filter((button) => {
    return selectedRow.value && selectedRow.value.type === 1 ? button.batch : button.continue
  })
})
function onRowClick(row: JobOrder, isContextMenu: boolean) {
  if (selectedRow.value === row && !isContextMenu)
    selectedRow.value = null
  else
    selectedRow.value = row
}
function onButtonClicked(link: string) {
  const jobOrder = selectedRow.value
  if (link === 'recipe') {
    navigateTo({
      path: `${route.path}/recipe`,
      query: {
        batchNo: jobOrder!.batchNo,
        correctionNo: jobOrder!.batchCorrectionNo,
        machineId: jobOrder!.machineId,
      },
    })
  } else if (link === 'parameters') {
    q.dialog({
      component: BatchParametersInfoDialog,
      componentProps: { jobOrder },
    })
  } else if (link === 'info') {
    q.dialog({
      component: JobOrderContinueInfoDialog,
      componentProps: { jobOrder },
    })
  } else if (link === 'reuse') {
    openBatchCreateFromSelected()
  }
}
async function showJobOrderOverview() {
  if (!selectedRow.value)
    return

  sessionStorage.setItem('jobOrderBatchNo', JSON.stringify(selectedRow.value.batchNo))
  const correctPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
  await navigateTo({
    path: correctPath,
  }, {
    open: {
      target: '_blank',
    },
  })
}
async function openBatchCreateFromSelected() {
  if (!selectedRow.value)
    return

  try {
    const data = await $fetch(`/api/job-orders/${selectedRow.value.batchNo}`)
    const variant = data?.recipeParams?.variantName ? { variantName: data.recipeParams.variantName } : undefined

    q.dialog({
      component: JobOrderBatchCreateDialog,
      componentProps: {
        recipeId: data?.recipeId ?? data?.recipeParams?.recipeId,
        machineId: data?.machines?.[0]?.machineId,
        variant,
        initialParams: data?.params,
      },
    }).onOk(async (payload: any) => {
      if (payload.print) {
        sessionStorage.setItem('jobOrderMaterials', JSON.stringify(payload.materials))
        sessionStorage.setItem('jobOrderParams', JSON.stringify(payload.params))
        sessionStorage.setItem('jobOrderMachines', JSON.stringify(payload.machines))
        sessionStorage.setItem('jobOrderRecipeParams', JSON.stringify(payload.recipeParams))
        const correctPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
        await navigateTo({
          path: correctPath,
        }, {
          open: {
            target: '_blank',
          },
        })
      }
      notifySuccess(t('Success'))
      getJobOrders()
    })
  } catch (e) {
    notifyFail(t('Failed'))
  }
}
const pagination = ref({ rowsPerPage: 50 } as QTableProps['pagination'])
watch(() => route.query.dispenserId, (val) => {
  const dispenser = dataStore.getDispenser(Number(val))
  updateDispenser(dispenser)
  getJobOrders()
})
function updateDispenser(val: Dispenser | undefined) {
  selectedRow.value = null
  dataStore.selectedDispenser = val
  if (val && val.dispenserId !== -1) {
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
  stateStore.jobOrderFilters = updatedFilters
  getJobOrders()
  selectedRow.value = null
}
function newBatchJobOrder() {
  q.dialog({
    component: JobOrderBatchCreateDialog,
  }).onOk(async (payload: any) => {
    if (payload.print) {
      sessionStorage.setItem('jobOrderMaterials', JSON.stringify(payload.materials))
      sessionStorage.setItem('jobOrderParams', JSON.stringify(payload.params))
      sessionStorage.setItem('jobOrderMachines', JSON.stringify(payload.machines))
      sessionStorage.setItem('jobOrderRecipeParams', JSON.stringify(payload.recipeParams))
      const correctPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
      await navigateTo({
        path: correctPath,
      }, {
        open: {
          target: '_blank',
        },
      })
    }
    notifySuccess(t('Success'))
    getJobOrders()
  },
  )
}
function newContinueJobOrder() {
  q.dialog({
    component: JobOrderContinueCreateDialog,
  }).onOk(() => {
    notifySuccess(t('Success'))
    getJobOrders()
  },
  )
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
    }).onOk(() => {
      setStatus(status, order)
    })
  } else {
    setStatus(status, order)
  }
}
async function setStatus(status: string, order: JobOrder) {
  try {
    await $fetch('/api/job-orders/set-status', { method: 'POST', query: { status: status === 'complete' ? 3 : 8, reqNo: order.jobId } })
    notifySuccess(t('Success'))
    getJobOrders()
  } catch (e) {
    notifyFail(t('Failed'))
  }
}
</script>

<template>
  <div class="q-pa-md">
    <div class="row q-gutter-md items-center justify-center m-5">
      <div>
        <QSelect
          v-if="false"
          v-model="selectedDispenser"
          borderless
          dense
          filled
          style="min-width: 30vw; max-width: 40vw;"
          emit-value
          map-options
          options-dense
          option-label="dispenserName"
          :options="dispenserSelections"
          @update:model-value="updateDispenser"
        />
      </div>
      <QBtn
        no-caps
        icon="note_add"
        color="primary"
        style="white-space: nowrap; text-overflow: ellipsis;"
        :label="t('NewBatchJobOrder')"
        @click="newBatchJobOrder"
      />
      <QBtn
        v-if="false"
        no-caps
        icon="note_add"
        color="primary"
        style="white-space: nowrap; text-overflow: ellipsis;"
        :label="t('NewContinueJobOrder')"
        @click="newContinueJobOrder"
      />
    </div>
    <FilterableTable
      v-model:pagination="pagination"
      :rows="jobOrders"
      :columns="filteredColumns"
      class="h-160 custom-filterable-table"
      :is-virtual-scroll="false"
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
            <span v-else-if="col.field === 'type'">
              {{ t(`jobOrderTypes.${props.row.type}`) }}
            </span>
            <span v-else>
              <span
                v-if="col.name === 'programNames' && selectedRow !== props.row"
                class="cell-truncate"
                :title="col.format ? col.format(props.row[col.field], props.row) : props.row[col.field]"
              >
                {{ col.format ? col.format(props.row[col.field], props.row) : props.row[col.field] }}
              </span>
              <span v-else>
                {{ col.format ? col.format(props.row[col.field], props.row) : props.row[col.field] }}
              </span>
            </span>
            <QMenu
              touch-position
              context-menu
            >
              <QList>
                <QItem
                  v-close-popup
                  clickable
                  @click="openBatchCreateFromSelected"
                >
                  <QItemSection>{{ t('NewBatchJobOrder') }}</QItemSection>
                </QItem>
                <QItem
                  v-close-popup
                  clickable
                  @click="showJobOrderOverview"
                >
                  <QItemSection>{{ t('ViewJobOrder') }}</QItemSection>
                </QItem>

                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('retry', selectedRow!)
                  "
                >
                  <QItemSection>{{ t('jobOrderActions.Retry') }}</QItemSection>
                </QItem>
                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('cancel', selectedRow!)
                  "
                >
                  <QItemSection>{{ t('jobOrderActions.Cancel') }}</QItemSection>
                </QItem>
                <QItem
                  v-close-popup
                  clickable
                  @click="
                    processRequest('complete', selectedRow!)
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
        v-for="button of filteredButtonProps"
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
  z-index: 1;
}
.custom-filterable-table {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.cell-truncate {
  display: inline-block;
  max-width: 22rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
