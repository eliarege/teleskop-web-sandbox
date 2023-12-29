<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import { Notify } from 'quasar'
import { navigateToPage, rowBGColorHandler, textAlignOverride } from '../shared/functions'
import { colors } from '~/shared/constants'
import type { Column } from '~/shared/types'

const { t } = useI18n()
const recetetartim = t('dispensingManager.recipeMeasurement')
const paginationSync = ref(5)
const paginationPageLeft = ref(1)

type Action = 'retry' | 'cancel'
interface ConfirmationDialog {
  vis: boolean
  act: Action
}

const actions = ref<Action[]>(['retry', 'cancel'])
const confirmationDialog = ref<ConfirmationDialog>({ vis: false, act: 'cancel' })

const machines = await $fetch('/api/machine/machines')
const columnsRecipe: Column[] = [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'batchCorrectionNo', label: t('correctionNo'), field: 'batchCorrectionNo', filterable: true, filterType: 'comparison' },
  { name: 'machinename', label: t('machinename'), field: 'machinename', filterable: true, filterType: 'select', selectionOptions: machines, optionLabel: 'machinename', optionValue: 'machineid' },
  { name: 'tankno', label: t('tankNo'), field: 'tankno', filterable: true, filterType: 'comparison' },
  { name: 'dispenserName', label: t('dispensingManager.materialDistributor'), field: 'dispenserName', filterable: true }, // TODO: Dispenserşarı dönen endpoint
  { name: 'programno', label: t('programNo'), field: 'programno', filterable: true, filterType: 'comparison' },
  { name: 'programname', label: t('programName'), field: 'programname', filterable: true }, // TODO: select
  { name: 'stepno', label: t('dispensingManager.stepNo'), field: 'stepno', filterable: true, filterType: 'comparison' },
  { name: 'recipeType', label: t('dispensingManager.recipeType'), field: 'recipeType', filterable: true, filterType: 'select', selectionOptions: [{ label: t('recipeTypes.0'), recipeType: 0 }, { label: t('recipeTypes.1'), recipeType: 1 }], optionLabel: 'label', optionValue: 'recipeType' },
  // filterType: 'select', selectionOptions: [{ label: t('recipeTypes.0'), recipeType: 0 }, { label: t('recipeTypes.1'), recipeType: 1 }], optionLabel: 'label', optionValue: 'recipeType'}]
  { name: 'recipeProcessNo', label: t('dispensingManager.recipeOrder'), field: 'recipeProcessNo', filterable: true, filterType: 'comparison' },
  { name: 'recipeStepNo', label: t('dispensingManager.recipeStepNum'), field: 'recipeStepNo', filterable: true, filterType: 'comparison' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]
const columnsMaterial = [
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'dispenserName', label: t('dispensingManager.materialDistributor'), field: 'dispenserName' },
  { name: 'amount', label: t('recipe.amount'), field: 'amount' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]

// TODO: Will request every 10 seconds to ensure data stream
const recipe = ref()
const recipeTypeDecider = ref('ongoing')
const filters = ref([])

const canceledVisible = ref(false)

await updateRecipe()

async function updateRecipe() {
  recipe.value = await $fetch(`/api/dispenser/joborderlogs?isCanceled=${canceledVisible.value}`, {
    method: 'post',
    body: filters.value,
  })
}
setInterval(updateRecipe, 10000)
const material = ref()
async function fetchMaterialData(reqnumber: number) {
  const materialDataTemp = await $fetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
  material.value = materialDataTemp
}

async function applyFilters(updatedValue: any) {
  filters.value = updatedValue
  await updateRecipe()
}

async function updateRecipeTable() {
  canceledVisible.value = !canceledVisible.value
  await updateRecipe()
}

const selectedRow = ref()

async function selectRow(row: any) {
  selectedRow.value = row
  await fetchMaterialData(row.reqnumber)
}

async function clickShowRecipe(row: any, isLogs: boolean) {
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.batchCorrectionNo}&isLogs=${isLogs}`)
}

async function completeProgram(row) {
  console.log(row)
  await $fetch('/api/dispenser/complete-program', {
    method: 'PUT',
    body: {
      reqNumber: row.reqnumber,
    },
  })
  await updateRecipe()
}

async function isRecipeDeleted(row) {
  console.log(row)
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

    const isWritten = await $fetch('/api/file/write-dispenser-step', {
      method: 'POST',
      body: {
        path: 'ozkantest/index.req',
        content: data,
        reqNumber: row.reqnumber,
      },
    })
    if (isWritten?.code === 200)
      Notify.create({
        message: t(`dispensingManager.${type}RequestSent`),
        type: 'positive',
        position: 'top',
      })
  }
}
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
              @click="selectRow(recipe.row)"
              @contextmenu="selectRow(recipe.row)"
            >
              <!-- @right="" -->
              <q-td
                v-for="row in recipe.cols"
                :key="row.name"
                :props="recipe"
                :style="rowBGColorHandler(row)"
              >
                <span v-if="row.field === 'status'">
                  {{ t(`statusCodes.${row.value}`) }}
                </span>
                <span v-else-if="row.field === 'recipeType'">
                  {{ t(`recipeTypes.${row.value}`) }}
                </span>
                <span v-else>
                  {{ row.value }}
                </span>
                <q-menu
                  touch-position
                  context-menu
                >
                  <!-- FIXME: min width should not be 300px -->
                  <q-list style="min-width: 300px;">
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row, true)"
                    >
                      <q-item-section>{{ t('dispensingManager.rcMenu.showLogs') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row, false)"
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
                        selectedRow.status === 3 || selectedRow.status === 8
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
        :class="textAlignOverride('left')"
      >
        <template #body="material">
          <q-tr>
            <q-td
              v-for="row in material.cols"
              :key="row.name"
              :props="material"
              :style="`${rowBGColorHandler(row)}`"
            >
              <span v-if="row.field === 'amount'">
                {{ row.value.toFixed(2) }}
              </span>
              <span v-else-if="row.field === 'status'" style="width: 10%">
                {{ t(`statusCodes.${row.value}`) }}
              </span>
              <span v-else>
                {{ row.value }}
              </span>
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
        :label="recetetartim"
        @click="navigateToPage('recete-tartim')"
      />
      <q-btn
        outline
        class=""
        color="black"
        icon="settings"
        :label="t('settings._')"
        @click="navigateToPage('settings')"
      />
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

.text-override-right :deep(.text-right){
  text-align: right;
  word-break: normal;
  white-space: normal;
}
.text-override-center :deep(.text-right){
  text-align: center;
  word-break: normal;
  white-space: normal;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
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
</style>
