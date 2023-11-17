<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { navigateToPage, rowBGColorHandler, textAlignOverride } from '../shared/functions'
import type { Column } from '~/shared/types'

const { t } = useI18n()
const jobordersText = t('joborders')
const finishedJobOrderText = t('finishedJobOrders')
const selectedRequestText = t('distributionProcessor.selectedRequest')
const dagitimyonet = t('distributionProcessor.a')
const hide = t('distributionProcessor.hide')
const recetetartim = t('distributionProcessor.recipeMeasurement')
const paginationSync = ref(5)
const paginationPageRight = ref(1)
const paginationPageLeft = ref(1)
const machines = await $fetch('/api/machine/machines')
const columnsRecipe: Column[] = [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'batchCorrectionNo', label: t('correctionNo'), field: 'batchCorrectionNo', filterable: true, filterType: 'comparison' },
  { name: 'machinename', label: t('machinename'), field: 'machinename', filterable: true, filterType: 'select', selectionOptions: machines, optionLabel: 'machinename', optionValue: 'machineid' },
  { name: 'tankno', label: t('tankNo'), field: 'tankno', filterable: true, filterType: 'comparison' },
  { name: 'dispenserName', label: t('distributionProcessor.a'), field: 'dispenserName', filterable: true }, // TODO: Dispenserşarı dönen endpoint
  { name: 'programno', label: t('programNo'), field: 'programno', filterable: true, filterType: 'comparison' },
  { name: 'programname', label: t('programName'), field: 'programname', filterable: true }, // TODO: select
  { name: 'stepno', label: t('distributionProcessor.stepNo'), field: 'stepno', filterable: true, filterType: 'comparison' },
  { name: 'recipeType', label: t('distributionProcessor.recipeType'), field: 'recipeType', filterable: true, filterType: 'select', selectionOptions: [{ label: t('recipeTypes.0'), recipeType: 0 }, { label: t('recipeTypes.1'), recipeType: 1 }], optionLabel: 'label', optionValue: 'recipeType' },
  // filterType: 'select', selectionOptions: [{ label: t('recipeTypes.0'), recipeType: 0 }, { label: t('recipeTypes.1'), recipeType: 1 }], optionLabel: 'label', optionValue: 'recipeType'}]
  { name: 'recipeProcessNo', label: t('distributionProcessor.recipeOrder'), field: 'recipeProcessNo', filterable: true, filterType: 'comparison' },
  { name: 'recipeStepNo', label: t('distributionProcessor.recipeStepNum'), field: 'recipeStepNo', filterable: true, filterType: 'comparison' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]
const columnsMaterial = [
  { name: 'materialName', label: t('materialName'), field: 'materialName' },
  { name: 'materialCode', label: t('materialCode'), field: 'materialCode' },
  { name: 'dispenserName', label: t('distributionProcessor.a'), field: 'dispenserName' },
  { name: 'amount', label: t('recipe.amount'), field: 'amount' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]
const finishedColumns = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
  { name: 'machinename', label: t('machinename'), field: 'machinename' },
  { name: 'dispenserName', label: t('distributionProcessor.a'), field: 'dispenserName' },
  { name: 'programname', label: t('programName'), field: 'programname' },
  { name: 'recipeType', label: t('distributionProcessor.recipeType'), field: 'recipeType' },
  { name: 'status', label: t('statusCodes.text'), field: 'status' },
]

// TODO: Will request every 10 seconds to ensure data stream
const recipe = ref()
const isChem = ref('chem')
const recipeTypeDecider = ref('ongoing')
const ongoingFilters = ref([])
const canceledFilters = ref([])
const recipeChem = ref()
const recipeDye = ref()
const canceledVisible = ref(false)
const canceled = ref()
// await updateRecipeChem()
// await updateRecipeDye()
await updateRecipe()
await updateRecipeCancel()
async function updateRecipe() {
  recipe.value = await $fetch('/api/dispenser/joborderlogs', {
    method: 'post',
    body: ongoingFilters.value,
  })
}
// async function updateRecipeChem() {
//   recipeChem.value = await $fetch('/api/dispenser/joborderlogs?type=chem', {
//     method: 'post',
//     body: ongoingFilters.value,
//   })
// }
// async function updateRecipeDye() {
//   recipeDye.value = await $fetch('/api/dispenser/joborderlogs?type=dye', {
//     method: 'post',
//     body: ongoingFilters.value,
//   })
// }

// updateRecipeTable()
async function updateRecipeCancel() {
  canceled.value = await $fetch('/api/dispenser/joborderlogs?isCanceled=true', {
    method: 'post',
    body: canceledFilters.value,
  })
}
const material = ref()
async function fetchMaterialData(reqnumber: number) {
  const materialDataTemp = await $fetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
  material.value = materialDataTemp
}

async function applyFiltersOngoing(updatedValue) {
  ongoingFilters.value = updatedValue
  await updateRecipe()
  // await updateRecipeChem()
  // await updateRecipeDye()
  // updateRecipeTable()
}

async function applyFiltersCanceled(updatedValue) {
  canceledFilters.value = updatedValue
  await updateRecipeCancel()
}

function updateRecipeTable() {
//   if (isChem.value === 'chem') {
//     canceledVisible.value = false
//     recipe.value = recipeChem.value
//   } else if (isChem.value === 'dye') {
//     canceledVisible.value = false
//     recipe.value = recipeDye.value
//   } else {
//     canceledVisible.value = !canceledVisible.value
//   }
  canceledVisible.value = !canceledVisible.value
}

const selectedJobOrder = ref()
const selectedJobOrderTableRow = ref()
const selectedChem = ref()
const a = ['']
const w = ' '
for (let i = 0; i < 2; i++) a.push(w)

async function selectRow(rowReqNumber: number) {
  selectedJobOrderTableRow.value = rowReqNumber
  await fetchMaterialData(rowReqNumber)
}

function toggleRow(row: any) {
  row.expand = !row.expand
}

async function clickShowRecipe(row, isLogs: boolean) {
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.batchCorrectionNo}&isLogs=${isLogs}`)
}
</script>

<template>
  <div class="dialog-class flex flex-row gap-5">
    <span class="header-class">
      Eliar - {{ t('distributionProcessor.a') }}
      <img
        src="/eliarname.png"
        class="invert-colors"
        style="display: flex; right: 1rem; position: absolute; height: 3rem; width: 3rem;"
      >
    </span>
    <div class="responsive-flex-container ">
      <div
        class="responsive-table"
        :style="canceledVisible ? 'display: none;' : ''"
      >
        <FilterableTable
          :rows="recipe"
          :columns="columnsRecipe"
          :pagination="{ rowsPerPage: paginationSync, page: paginationPageLeft }"
          @update:pagination="(newPag) => { paginationSync = newPag.rowsPerPage, paginationPageLeft = newPag.page }"
          @update-filter-slots="(evt) => applyFiltersOngoing(evt)"
        >
          <!-- style="width: 55%; height: 100%;" -->
          <template #top-right>
            <q-space />
            <div class="mt-2">
              <q-btn-toggle
                v-model="recipeTypeDecider"
                class="table-header-toggle"
                toggle-color="secondary"
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
              :class="{ 'selected-row': selectedJobOrderTableRow === recipe.row.reqnumber }"
              style="cursor: pointer;"
              @click="selectRow(recipe.row.reqnumber)"
              @contextmenu="selectRow(recipe.row.reqnumber)"
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
                      <q-item-section>{{ t('distributionProcessor.rcMenu.showLogs') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row, false)"
                    >
                      <q-item-section>{{ t('distributionProcessor.rcMenu.showRecipe') }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item v-close-popup clickable>
                      <q-item-section>{{ t('distributionProcessor.rcMenu.retry') }}</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable>
                      <q-item-section>{{ t('distributionProcessor.rcMenu.cancel') }}</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable>
                      <q-item-section>{{ t('distributionProcessor.rcMenu.complete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </div>
      <div
        class="responsive-table"
        :style="canceledVisible ? '' : 'display: none'"
      >
        <FilterableTable
          :rows="canceled"
          :columns="finishedColumns"
          :is-expandable="true"
          :pagination="{ rowsPerPage: paginationSync, page: paginationPageRight }"
          @update:pagination="(newPag) => { paginationSync = newPag.rowsPerPage, paginationPageRight = newPag.page }"
          @update-filter-slots="(evt) => applyFiltersCanceled(evt)"
        >
          <!-- style="width: 100%; height: 100%;" -->
          <template #top-right>
            <div class="mt-2 absolute right-3">
              <q-space />
              <q-btn-toggle
                v-model="recipeTypeDecider"
                class="table-header-toggle"
                toggle-color="secondary"
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
          <template #custombody="props">
            <q-tr :props="props">
              <q-td>
                <q-btn
                  size="sm"
                  color="accent"
                  round
                  dense
                  :icon="props.row.expand ? 'remove' : 'add'"
                  @click="toggleRow(props.row)"
                />
              </q-td>
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :style="rowBGColorHandler(col)"
              >
                <span v-if="col.field === 'status'">
                  {{ t(`statusCodes.${col.value}`) }}
                </span>
                <span v-else-if="col.field === 'recipeType'">
                  {{ t(`recipeTypes.${col.value}`) }}
                </span>
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
            <q-menu
              touch-position
              context-menu
            >
              <!-- FIXME: min width should not be 300px -->
              <q-list style="min-width: 300px;">
                <q-item
                  v-close-popup
                  clickable
                  @click="clickShowRecipe(props.row, true)"
                >
                  <q-item-section>{{ t('distributionProcessor.rcMenu.showLogs') }}</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="clickShowRecipe(props.row, false)"
                >
                  <q-item-section>{{ t('distributionProcessor.rcMenu.showRecipe') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item v-close-popup clickable>
                  <q-item-section>{{ t('distributionProcessor.rcMenu.retry') }}</q-item-section>
                </q-item>
                <q-item v-close-popup clickable>
                  <q-item-section>{{ t('distributionProcessor.rcMenu.cancel') }}</q-item-section>
                </q-item>
                <q-item v-close-popup clickable>
                  <q-item-section>{{ t('distributionProcessor.rcMenu.complete') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <q-tr v-show="props.row.expand" :props="props">
              <q-td colspan="100%">
                <div class="gap-5 flex flex-row">
                  <span> {{ t('correctionNo') }}: {{ props.row.batchCorrectionNo }} </span>
                  <span> {{ t('tankNo') }}: {{ props.row.tankno }} </span>
                  <span> {{ t('programNo') }}: {{ props.row.programno }} </span>
                  <span> {{ t('distributionProcessor.stepNo') }}: {{ props.row.stepno }} </span>
                  <span> {{ t('distributionProcessor.recipeOrder') }}: {{ props.row.recipeProcessNo }} </span>
                  <span> {{ t('distributionProcessor.recipeStepNum') }}: {{ props.row.recipeStepNo }} </span>
                </div>
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </div>
    </div>
    <span class="header-class">
      {{ t('distributionProcessor.selectedRequest') }}
    </span>
    <div class="ml-5 mr-5" style="width: 100%;">
      <!-- Job order's requested materials table -->
      <q-table
        flat
        bordered
        :title="selectedRequestText"
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
              :style="`background-color:${rowBGColorHandler(row)}`"
            >
              <span v-if="row.field === 'amount'">
                {{ row.value.toFixed(2) }}
              </span>
              <span v-else-if="row.field === 'status'">
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

    <div class="footer-buttons gap-5 ml-5">
      <!-- <div class="left">
        <q-btn
          outline
          color="primary"
          :label="dagitimyonet"
        />
      </div> -->
      <div class="right">
        <q-btn
          outline
          color="primary"
          :label="recetetartim"
          @click="navigateToPage('recete-tartim')"
        />
      </div>
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
  background-color: rgb(70, 56, 141);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 3rem;
}

.footer-buttons .left {
  position: absolute;
  left: 0;
}

.footer-buttons .right {
  position: absolute;
  right: 1vw;
  display: flex;
  gap: 1vw;
}
</style>
