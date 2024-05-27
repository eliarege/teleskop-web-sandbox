<script setup lang="ts">
import { Notify } from 'quasar'
import { useTimeoutPoll } from '@vueuse/core'
import { cellRGBColorHandler, navigateToPage, textAlignOverride } from '../shared/functions'
import { StatusCodes, colors } from '~/shared/constants'
import type { Column } from '~/shared/types'

const { t } = useI18n()
const paginationSync = ref(500)
const paginationPageLeft = ref(1)

type Action = 'retry' | 'cancel'
interface ConfirmationDialog {
  vis: boolean
  act: Action
}

const actions = ref<Action[]>(['retry', 'cancel'])
const confirmationDialog = ref<ConfirmationDialog>({ vis: false, act: 'cancel' })
const { data: connectionStatus, refresh: refreshConnectionStatus } = await useFetch<any[]>('/api/dispenser-connection-status', { default: () => [] })
useTimeoutPoll(refreshConnectionStatus, 10000, { immediate: true })
const machines = await $fetch('/api/machine/machines')
const dispensers = await $fetch('/api/settings/dispenser')
const columnsRecipe = computed<Column[]>(() => [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
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
      const status = connectionStatus.value?.find(status => status.dispNo === row.dispNo)?.status
      return ['status-class', status ? 'success-class' : 'fail-class'].join(' ')
    },
  }, // TODO: Dispenserşarı dönen endpoint
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
const columnsMaterial = computed<Column[]>(() => [
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
const selectedRow = ref()
const material = ref([])

const canceledVisible = ref(false)

updateRecipe()

async function updateRecipe() {
  recipe.value = await $fetch(`/api/dispenser/joborderlogs?isCanceled=${canceledVisible.value}`, {
    method: 'post',
    body: filters.value,
  })
  if (recipe.value?.length) {
    selectedRow.value = recipe.value[0]
    await fetchMaterialData(selectedRow.value.reqnumber)
  } else
    selectedRow.value = null
}
setInterval(updateRecipe, 10000)

async function fetchMaterialData(reqnumber: number) {
  material.value = await $fetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
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
  if (selectedRow.value?.reqnumber)
    await fetchMaterialData(selectedRow.value.reqnumber)
  else
    material.value = []
}

async function selectRow(rowIndex: any) {
  selectedRow.value = recipe.value[rowIndex]
  selectedRow.value.rowIndex = rowIndex
  await fetchMaterialData(selectedRow.value.reqnumber)
}

async function clickShowRecipe(row: any, isLogs: string) {
  const params = new URLSearchParams({ joborder: row.joborder, correctionNo: row.batchCorrectionNo, isLogs })
  await navigateToPage(`recete-tartim?${params}`)
}

async function completeProgram(row) {
  await $fetch('/api/dispenser/complete-program', {
    method: 'PUT',
    body: {
      reqNumber: row.reqnumber,
    },
  })
  await updateRecipe()
}

async function isRecipeDeleted(row) {
  const isDeleted = await $fetch('/api/dispenser/check-status', {
    method: 'POST',
    body: {
      joborder: row.joborder,
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
    const countInProgram = await $fetch('/api/dispenser/total-step-count', {
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
      row.joborder,
      row.programno,
      row.stepno,
      row.recipeStepNo,
      countInProgram,
      row.recipeType,
      row.recipeProcessNo,
      type === 'retry' ? 1 : 0,
    ]

    try {
      await $fetch('/api/file/write-dispenser-step', {
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

function handleKeyUp(event) {
  if (event.key === 'ArrowUp') {
    if (selectedRow.value.rowIndex) {
      selectRow(selectedRow.value.rowIndex - 1)
    }
  } else if (event.key === 'ArrowDown') {
    if (selectedRow.value.rowIndex !== undefined && recipe.value[selectedRow.value.rowIndex + 1]) {
      event.preventDefault()
      selectRow(selectedRow.value.rowIndex + 1)
    }
  }
}

function searchFilterUpdated(evt: any) {
  if (evt) {
    material.value = []
    selectedRow.value = null
  }
}

onMounted(() => {
  window.addEventListener('keyup', handleKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="dialog-class flex flex-row gap-5">
    <div class="responsive-flex-container ">
      <div
        class="responsive-table"
      >
        <FilterableTable
          :rows="recipe"
          :columns="columnsRecipe"
          class="h-120"
          :pagination="{ rowsPerPage: paginationSync, page: paginationPageLeft }"
          @update:pagination="(newPag: any) => { paginationSync = newPag.rowsPerPage, paginationPageLeft = newPag.page }"
          @update-filter-slots="(evt) => applyFilters(evt)"
          @update-search-filter="(evt) => searchFilterUpdated(evt)"
        >
          <!-- style="width: 55%; height: 100%;" -->
          <template #top-right>
            <q-space />
            <div class="mt-2 top-r-class">
              <q-btn-toggle
                v-model="recipeTypeDecider"
                class="table-header-toggle"
                toggle-color="black"
                :options="[
                  // { label: t('chemical'), value: 'chem' },
                  // { label: t('dye'), value: 'dye' },
                  { label: t('ongoingJoborders'), value: 'ongoing' },
                  { label: t('canceledJobOrdersTable'), value: 'cancel' },
                ]"
                @update:model-value="updateRecipeTable()"
              />
            </div>
          </template>
          <template #custombody="recipe">
            <q-tr
              :class="{ 'selected-row': selectedRow === recipe.row }"
              style="cursor: pointer;"
              :style="selectedRow === recipe.row
                ? 'background-color: #cce8ff;'
                : recipe.rowIndex % 2
                  ? `background-color: ${colors.tableGray}`
                  : '' "
              @click="selectRow(recipe.rowIndex)"
              @contextmenu="selectRow(recipe.rowIndex)"
            >
              <!-- @right="" -->
              <q-td
                v-for="row in recipe.cols"
                :key="row.name"
                :props="recipe"
              >
                {{ row.value }}
                <q-menu
                  touch-position
                  context-menu
                >
                  <!-- FIXME: min width should not be 300px -->
                  <q-list style="min-width: 300px;">
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row, 'true')"
                    >
                      <q-item-section>{{ t('dispensingManager.rcMenu.showLogs') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row, 'false')"
                    >
                      <q-item-section>{{ t('dispensingManager.rcMenu.showRecipe') }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      v-for="act in actions"
                      :key="act"
                      v-close-popup
                      clickable
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
                      @click="completeProgram(selectedRow)"
                    >
                      <q-item-section>{{ t('dispensingManager.rcMenu.complete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-td>
            </q-tr>
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
      <!-- Job order's requested materials table -->
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
    <div class="flex justify-end w-full gap-5 pr-5 pb-5 ">
      <q-btn
        outline
        class=""
        color="black"
        :label="t('dispensingManager.recipeMeasurement')"
        @click="navigateToPage('recete-tartim')"
      />
      <!-- <q-btn
        outline
        class=""
        color="black"
        icon="settings"
        :label="t('settings._')"
        @click="navigateToPage('settings')"
      /> -->
    </div>
  </div>
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
.selected-row {
  background-color: #cce8ff;
}
.dialog-class {
  height: 100%;
  width: 100%;
  justify-content: center;
}

.text-override-left :deep(.text-right){
  text-align: left;
}

.header-class {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 3rem;
}

.status-class::after {
  font-family: 'Material Icons';
  display: inline-block;
  font-size: 1rem;
  position: relative;
  padding-left: 0.25rem;
  vertical-align: sub;
  background-color: transparent;
}
.status-class.success-class::after {
  color: green;
  content: 'check_circle';
}
.status-class.fail-class::after {
  content: 'cancel';
  @apply text-gray-800;
}
</style>
