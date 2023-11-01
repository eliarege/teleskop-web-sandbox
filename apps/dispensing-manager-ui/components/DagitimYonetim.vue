<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { navigateToPage, textAlignOverride } from '../shared/functions'
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

const columnsRecipe: Column[] = [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'batchCorrectionNo', label: t('correctionNo'), field: 'batchCorrectionNo' },
  { name: 'machinename', label: t('machinename'), field: 'machinename' },
  { name: 'tankno', label: t('tankNo'), field: 'tankno' },
  { name: 'dispenserName', label: t('distributionProcessor.a'), field: 'dispenserName' },
  { name: 'programno', label: t('programNo'), field: 'programno' },
  { name: 'programname', label: t('programName'), field: 'programname' },
  { name: 'stepno', label: t('distributionProcessor.stepNo'), field: 'stepno' },
  { name: 'recipeType', label: t('distributionProcessor.recipeType'), field: 'recipeType' },
  { name: 'recipeProcessNo', label: t('distributionProcessor.recipeOrder'), field: 'recipeProcessNo' },
  { name: 'recipeStepNo', label: t('distributionProcessor.recipeStepNum'), field: 'recipeStepNo' },
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
const { data: recipeChem } = await useFetch('/api/dispenser/joborderlogs?type=chem')
const { data: recipeDye } = await useFetch('/api/dispenser/joborderlogs?type=dye')
recipe.value = recipeChem.value

const { data: canceled } = await useFetch('/api/dispenser/joborderlogs?isCanceled=true')
const material = ref()
async function fetchMaterialData(reqnumber: number) {
  const materialDataTemp = await $fetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
  material.value = materialDataTemp
  console.log(material.value)
}

function rowBGColorHandler(row: any) {
  let temp = 'background-color: '
  if (row.field === 'status') {
    if (row.value === 0)
      temp += '#007BFF'
    if (row.value === 1)
      temp += '#64abfc'
    if (row.value === 2)
      temp += '#73cece'
    if (row.value === 4)
      temp += '#7f72fa'
    if (row.value === 10)
      temp += '#ffbb00'
    if (row.value === 3)
      temp += '#4CAF50'
    if (row.value === 8)
      temp += '#FF4B4B'
    temp += '; color: white; font-weight: bolder; font-size: large'
  }
  return temp
}

const selectedJobOrder = ref()
const selectedJobOrderTableRow = ref()
const selectedChem = ref()
const a = ['']
const w = ' '
for (let i = 0; i < 2; i++) a.push(w)

async function selectRow(rowReqNumber: number) {
  console.log(rowReqNumber)
  selectedJobOrderTableRow.value = rowReqNumber
  await fetchMaterialData(rowReqNumber)
}

function toggleRow(row: any) {
  row.expand = !row.expand
}

async function clickShowRecipe(row) {
  console.log(row)
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.batchCorrectionNo}`)
}

const isChem = ref(true)
</script>

<template>
  <div class="dialog-class flex  flex-row gap-5">
    <span class="header-class">
      Eliar - {{ t('distributionProcessor.a') }}
      <img
        src="/eliarname.png"
        class="invert-colors"
        style="display: flex; right: 1rem; position: absolute; height: 3rem; width: 3rem;"
      >
    </span>
    <div class="ml-5 mr-5 gap-5 flex flex-row">
      <!-- Incoming joborders table -->
      <div>
        <!-- :title="jobordersText" -->
        <!-- :class="textAlignOverride('left')" -->
        <FilterableTable
          :key="isChem ? 'chem' : 'dye'"
          :rows="recipe"
          :columns="columnsRecipe"
          class="table-header-word-break-override"
          :pagination="{ rowsPerPage: paginationSync, page: paginationPageLeft }"
          style="width: 55vw; height: 100%;"
          @update:pagination="(newPag) => { paginationSync = newPag.rowsPerPage, paginationPageLeft = newPag.page }"
        >
          <template #top-right>
            <q-space />
            <q-btn-toggle
              v-model="isChem"
              class="table-header-toggle"
              toggle-color="secondary"
              :options="[
                { label: t('chemical'), value: true },
                { label: t('dye'), value: false },
              ]"
              @update:model-value="isChem ? recipe = recipeChem : recipe = recipeDye"
            />
            <!-- @vnode-updated="isChem ? recipe = recipeChem : recipe = recipeDye + console.log(isChem)" -->
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
                <span v-else>
                  {{ row.value }}
                </span>
                <q-menu
                  touch-position
                  context-menu
                >
                  <!-- FIXME: min width should not be 300px -->
                  <q-list style="min-width: 300px;">
                    <q-item v-close-popup clickable>
                      <q-item-section>{{ t('distributionProcessor.rcMenu.showLogs') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="clickShowRecipe(recipe.row)"
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
      <!-- Canceled orders table -->
      <div>
        <!-- :title="finishedJobOrderText" -->
        <!-- row-key="name" -->
        <!-- :class="textAlignOverride('left')" -->
        <FilterableTable
          :rows="canceled"
          :columns="finishedColumns"
          :is-expandable="true"
          :pagination="{ rowsPerPage: paginationSync, page: paginationPageRight }"
          style="width: 40vw; height: 100%;"
          @update:pagination="(newPag) => { paginationSync = newPag.rowsPerPage, paginationPageRight = newPag.page }"
        >
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
                <span v-else>
                  {{ col.value }}
                </span>
              </q-td>
            </q-tr>
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
    <!-- <span class="header-class">
      {{ t('distributionProcessor.incidents') }}
    </span>
    <div class="flex flex-col ml-5">
      <q-virtual-scroll
        type="table"
        style="max-height: 20vh; width: 95vw;"
        :items="a"
      >
        <span v-for="element of a" class="">
          <p>{{ element }}</p>
        </span>
      </q-virtual-scroll>
    </div>
    <span class="header-class">
      {{ t('distributionProcessor.alerts') }}
    </span>
    <div class="flex flex-col ml-5">
      <q-virtual-scroll
        type="table"
        style="max-height: 20vh; width: 95vw;"
        :items="a"
      >
        <span v-for="element of a" class="">
          <p>{{ element }}</p>
        </span>
      </q-virtual-scroll>
    </div> -->
    <div class="footer-buttons gap-5 ml-5">
      <div class="left">
        <q-btn
          outline
          color="primary"
          :label="dagitimyonet"
        />
      </div>
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
img.invert-colors {
  filter: invert(1);
}
.selected-row {
  background-color: #cce8ff;
}
.dialog-class {
  height: 100vh;
  width: 100%;
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

.footer-buttons {
  position: relative;
  height: 8vh;
  margin-bottom: 60px;
  width: 100%;
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
