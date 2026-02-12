<script setup lang="ts">
import { Notify } from 'quasar'
import { useTimeoutPoll } from '@vueuse/core'
import type { QTableProps } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import { cellRGBColorHandler, navigateToPage, textAlignOverride } from '../shared/functions'
import { DispenserConnectionStatus, StatusCodes, colors } from '~/shared/constants'

const { t } = useI18n()
const selectedRow = ref()
type Action = 'retry' | 'cancel'
interface ConfirmationDialog {
  vis: boolean
  act: Action
}
const keycloak = useKeycloak()

const actions = ref<Action[]>(['retry', 'cancel'])
const confirmationDialog = ref<ConfirmationDialog>({ vis: false, act: 'cancel' })
const { data: connectionStatus, refresh: refreshConnectionStatus } = await useAuthFetch<any[]>('/api/settings/dispenser-connection-status', { default: () => [] })
useTimeoutPoll(refreshConnectionStatus, 120000, { immediate: true })
const machines = await keycloak.fetch('/api/machine/machines')
const dispensers = await keycloak.fetch('/api/settings/dispenser')
const columnsRecipe = computed<Array<FilterableTableColumn>>(() => [
  { name: 'jobOrder', label: t('jobOrder'), field: 'jobOrder', filterable: true, filterType: 'comparison' },
  { name: 'batchCorrectionNo', label: t('correctionNo'), field: 'batchCorrectionNo', filterable: true, filterType: 'comparison' },
  {
    name: 'machinename',
    label: t('machinename'),
    field: 'machinename',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines,
    optionLabel: 'machinename',
    optionValue: 'machineid',
  },
  { name: 'tankno', label: t('tankNo'), field: 'tankno', filterable: true, filterType: 'comparison' },
  {
    name: 'name',
    label: t('dispensingManager.materialDistributor'),
    field: 'name',
    filterable: true,
    filterType: 'select',
    selectionOptions: dispensers,
    optionLabel: 'name',
    optionValue: 'dispNo',
    classes(row) {
      const status = connectionStatus.value?.find(status => status.dispNo === row.dispNo)?.connectionStatus
      return ['dispenser-status-class', status === DispenserConnectionStatus.connected
        ? 'connected-class'
        : status === DispenserConnectionStatus.notConnected
          ? 'not-connected-class'
          : status === DispenserConnectionStatus.pathNotAccesible
            ? 'path-not-accesible-class'
            : status === DispenserConnectionStatus.serviceUnaccesible
              ? 'service-unaccesible-class'
              : ''].join(' ')
    },
  },
  { name: 'programno', label: t('programNo'), field: 'programno', filterable: true, filterType: 'comparison' },
  {
    name: 'programname',
    label: t('programName'),
    field: 'programname',
    filterable: true,
    filterType: 'includes',
    style: row => 'max-width: 15rem; overflow-x: hidden;',
  },
  { name: 'stepno', label: t('dispensingManager.stepNo'), field: 'stepno', filterable: true, filterType: 'comparison' },
  {
    name: 'recipeType',
    label: t('dispensingManager.recipeType'),
    field: 'recipeType',
    format: val => t(`recipeTypes.${val}`),
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('recipeTypes.0'), recipeType: 0 },
      { label: t('recipeTypes.1'), recipeType: 1 },
    ],
    optionLabel: 'label',
    optionValue: 'recipeType',
  },
  // filterType: 'select', selectionOptions: [{ label: t('recipeTypes.0'), recipeType: 0 }, { label: t('recipeTypes.1'), recipeType: 1 }], optionLabel: 'label', optionValue: 'recipeType'}]
  { name: 'recipeProcessNo', label: t('dispensingManager.recipeOrder'), field: 'recipeProcessNo', filterable: true, filterType: 'comparison' },
  { name: 'recipeStepNo', label: t('dispensingManager.recipeStepNum'), field: 'recipeStepNo', filterable: true, filterType: 'comparison' },
  {
    name: 'status',
    label: t('statusCodes.text'),
    field: 'status',
    format: val => t(`statusCodes.${val}`),
    style: row => cellRGBColorHandler(row.status),
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('statusCodes.0'), status: StatusCodes.newRequest },
      { label: t('statusCodes.1'), status: StatusCodes.inDispenser },
      { label: t('statusCodes.2'), status: StatusCodes.inProcess },
      { label: t('statusCodes.3'), status: StatusCodes.requestCompleted },
      { label: t('statusCodes.4'), status: StatusCodes.priorityChanged },
      { label: t('statusCodes.8'), status: StatusCodes.canceled },
      { label: t('statusCodes.10'), status: StatusCodes.dispenserChanged },
    ],
    optionLabel: 'label',
    optionValue: 'status',
  },
])
const columnsMaterial = computed<Array<FilterableTableColumn>>(() => [
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'name', label: t('dispensingManager.materialDistributor'), field: 'name' },
  { name: 'amount', label: t('recipe.amount'), field: 'amount', format: val => val.toFixed(2) },
  { name: 'status', label: t('statusCodes.text'), field: 'status', format: val => t(`statusCodes.${val}`), style: row => cellRGBColorHandler(row.status) },
])

// TODO: Will request every 10 seconds to ensure data stream
const recipe = ref([])
const recipeTypeDecider = ref('ongoing')
const filters = ref([])
const material = ref([])

const canceledVisible = ref(false)

updateRecipe()

async function updateRecipe() {
  recipe.value = await keycloak.fetch(`/api/dispenser/joborderlogs?isCanceled=${canceledVisible.value}`, {
    method: 'post',
    body: filters.value,
  })
  const isRowStillExist = recipe.value.find((row: any) => selectedRow.value?.reqnumber === row.reqnumber)
  if (!isRowStillExist) {
    if (recipe.value?.length) {
      selectedRow.value = recipe.value[0]
      // await fetchMaterialData(selectedRow.value.reqnumber)
    } else {
      selectedRow.value = null
    }
  } else {
    selectedRow.value = isRowStillExist
  }
}
const updateRecipeInterval = setInterval(updateRecipe, 10000)
onUnmounted(() => {
  clearInterval(updateRecipeInterval)
})

async function fetchMaterialData(reqnumber: number) {
  if (reqnumber)
    material.value = await keycloak.fetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
  else
    material.value = []
}

async function applyFilters(updatedValue: any) {
  filters.value = updatedValue
  material.value = []
  selectedRow.value = null
  await updateRecipe()
}

async function updateRecipeTable() {
  canceledVisible.value = !canceledVisible.value
  await updateRecipe()
  selectedRow.value = recipe.value[0] ? recipe.value[0] : null
}
watch(selectedRow, async (newSelected) => {
  await fetchMaterialData(newSelected?.reqnumber)
})
async function clickShowRecipe(row: any, isLogs: string) {
  const params = new URLSearchParams({ jobOrder: row.jobOrder, correctionNo: row.batchCorrectionNo, isLogs })
  await navigateToPage(`recipe?${params}`)
}

async function completeProgram(row) {
  await keycloak.fetch('/api/dispenser/complete-program', {
    method: 'PUT',
    body: {
      reqNumber: row.reqnumber,
    },
  })
  await updateRecipe()
}

async function isRecipeDeleted(row) {
  const isDeleted = await keycloak.fetch('/api/dispenser/check-status', {
    method: 'POST',
    body: {
      jobOrder: row.jobOrder,
      correctionNo: row.batchCorrectionNo,
    },
  })
  return isDeleted
}

async function processRequest(type: 'retry' | 'cancel', row: any) {
  const isDeleted = await isRecipeDeleted(row)
  if (isDeleted)
    Notify.create({
      message: t('dispensingManager.recipeDeletedWarning'),
      type: 'warning',
      position: 'top',
    })
  else {
    const countInProgram = await keycloak.fetch('/api/dispenser/total-step-count', {
      method: 'POST',
      body: {
        plankey: row.plankey,
        recipeProcessNo: row.recipeProcessNo,
        recipeType: row.recipeType,
      },
    })

    const data = [
      type === 'retry' ? 1 : 8,
      row.priority,
      row.machineid,
      row.tankno,
      row.jobOrder,
      row.programno,
      row.stepno,
      row.recipeStepNo,
      countInProgram,
      row.recipeType,
      row.recipeProcessNo,
      type === 'retry' ? 1 : 0,
    ]

    try {
      await keycloak.fetch('/api/file/write-dispenser-step', {
        method: 'POST',
        body: {
          content: data,
          reqNumber: row.reqnumber,
          terminal: row.terminal,
          type,
        },
      })
      Notify.create({
        message: t(`dispensingManager.${type}RequestSent`),
        type: 'positive',
        position: 'top',
      })
    } catch (err) {
      Notify.create({
        message: t(`dispensingManager.${type}RequestDidNotSend`),
        type: 'warning',
        position: 'top',
      })
    }
  }
}

function searchFilterUpdated(evt: any) {
  if (evt) {
    material.value = []
    selectedRow.value = null
  }
}
async function updateSelectedRow(evt: any) {
  selectedRow.value = evt
  await fetchMaterialData(evt.reqnumber)
}
const pagination = ref({ rowsPerPage: 7 } as QTableProps['pagination'])
const hasManagerRole = computed(() => {
  return keycloak.hasResourceRole('manage')
})
</script>

<template>
  <div class="dialog-class flex flex-row gap-5 mb-12">
    <div class="responsive-flex-container ">
      <div
        class="responsive-table"
      >
        <FilterableTable
          v-model:selected="selectedRow"
          v-model:pagination="pagination"
          :rows="recipe"
          :columns="columnsRecipe"
          class="h-120"
          row-key="reqnumber"
          :is-virtual-scroll="true"
          :enable-key-strokes="true"
          @update-filter-slots="(evt) => applyFilters(evt)"
          @update-search-filter="(evt) => searchFilterUpdated(evt)"
        >
          <!-- @update-selected="evt => updateSelectedRow(evt)" -->
          <template #top-right>
            <q-space />
            <div class="mt-2 top-r-class">
              <q-btn-toggle
                v-model="recipeTypeDecider"
                class="table-header-toggle"
                toggle-color="black"
                :options="[
                  { label: t('ongoingJoborders'), value: 'ongoing' },
                  { label: t('canceledJobOrdersTable'), value: 'cancel' },
                ]"
                @update:model-value="updateRecipeTable()"
              />
            </div>
          </template>
          <template #contextmenu>
            <q-menu
              touch-position
              context-menu
            >
              <q-list style="min-width: 300px;">
                <q-item
                  v-close-popup
                  clickable
                  @click="clickShowRecipe(selectedRow, 'true')"
                >
                  <q-item-section>{{ t('dispensingManager.rcMenu.showLogs') }}</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="clickShowRecipe(selectedRow, 'false')"
                >
                  <q-item-section>{{ t('dispensingManager.rcMenu.showRecipe') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-for="act in actions"
                  :key="act"
                  v-close-popup
                  clickable
                  :disable="!hasManagerRole"
                  @click="
                    selectedRow.status === StatusCodes.requestCompleted || selectedRow.status === StatusCodes.canceled
                      ? processRequest(act, selectedRow)
                      : confirmationDialog = { vis: true, act }
                  "
                >
                  <q-item-section>{{ t(`dispensingManager.rcMenu.${act}`) }}</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :disable="!hasManagerRole"
                  @click="completeProgram(selectedRow)"
                >
                  <q-item-section>{{ t('dispensingManager.rcMenu.complete') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </template>
        </FilterableTable>
      </div>
    </div>
    <q-dialog v-model="confirmationDialog.vis" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="help"
            color="white"
          />
          {{ t('dispensingManager.alreadyStartedWarning') }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('no')"
            outline
            icon="close"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('yes')"
            icon="check"
            @click="processRequest(confirmationDialog.act, selectedRow)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <span class="header-class">
      {{ t('dispensingManager.selectedRequest') }}
    </span>

    <div class="ml-5 mr-5" style="width: 100%;">
      <q-table
        flat
        bordered
        :columns="columnsMaterial"
        :rows="material"
        row-key="name"
        class="material-table"
        :class="textAlignOverride('left')"
      >
        <template #header="tableProps">
          <q-tr :props="tableProps">
            <q-th
              v-for="col in tableProps.cols"
              :key="col.name"
              :props="tableProps"
            >
              <div
                class="column-group"
                :style="col.filterable ? 'cursor: pointer;' : ''"
              >
                {{ col.label }}
              </div>
            </q-th>
          </q-tr>
        </template>
        <template #body="material">
          <q-tr>
            <q-td
              v-for="row in material.cols"
              :key="row.name"
              :props="material"
            >
              {{ row.value }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </div>

  <DispenserStatusBar :dispenser-connection-statuses="connectionStatus" />
</template>

<style scoped>
@media (max-width: 768px) {
  .table-header-toggle :deep(.q-btn) {
    line-height: 1rem !important;
  }
  .responsive-flex-container {
    display: block !important;
  }

  .responsive-table {
    width: 100%;
    margin-right: 0.2rem;
  }
}

.material-table {
  border: 1px solid rgb(0, 0, 0);
  border-radius: 5px;
  padding: 3px 8px;
}
.column-group {
  width: 100%;
  justify-content: center;
  padding: 0.25em 0.65em;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  color: rgb(0, 0, 0);
  font-size: 12.5px;
  font-weight: 700;
}
.responsive-flex-container {
  display: flex;
  justify-content: center;
  overflow-x: hidden;
  width: 100%;
  padding: 1rem;
  min-height: 25rem;
}
.responsive-table {
  width: 100%;
}
img.invert-colors {
  filter: invert(1);
}

.top-r-class {
  word-break: keep-all;
  white-space: nowrap;
}

.dialog-class {
  height: 100%;
  width: 100%;
  justify-content: center;
}

.text-override-left :deep(.text-right) {
  text-align: left;
}

.header-class {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: large;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 2.5rem;
}
</style>
