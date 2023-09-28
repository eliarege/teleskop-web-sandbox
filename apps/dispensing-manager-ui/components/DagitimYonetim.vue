<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { navigateToPage } from '../shared/functions'

const { t } = useI18n()
const jobordersText = t('joborders')
const finishedJobOrderText = 'Biten İş Emirleri'
const selectedRequestText = t('distributionProcessor.selectedRequest')
const dagitimyonet = t('distributionProcessor.a')
const hide = t('distributionProcessor.hide')
const recetetartim = t('distributionProcessor.recipeMeasurement')

const columnsRecipe = [
  { name: 'joborder', label: t('joborder'), field: 'joborder' },
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

const { data: recipe } = await useFetch('/api/dispenser/joborderlogs')
const { data: canceled } = await useFetch('/api/dispenser/joborderlogs?isCanceled=true')
const material = ref()
async function fetchMaterialData(reqnumber: number) {
  const { data: materialDataTemp } = await useFetch(`/api/dispenser/requestmaterials?reqnumber=${reqnumber}`)
  material.value = materialDataTemp.value
  console.log(material.value)
}

function rowBGColorHandler(row: any) {
  if (row.field === 'status') {
    if (row.value === 0) return '#b7eeff'
    if (row.value === 1) return '#8dffcf'
    if (row.value === 2) return '#38df4e'
    if (row.value === 4) return '#eda72d'
    if (row.value === 10) return '#eb7979'
    if (row.value === 3) return '#61b3ff'
    if (row.value === 8) return '#ff0000'
  }
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

function textAlignOverride(pos: string) {
  if (pos === 'center') return 'text-override-center'
  if (pos === 'left') return 'text-override-left'
  if (pos === 'right') return 'text-override-right'
}

function toggleRow(row: any) {
  row.expand = !row.expand
}
</script>

<template>
  <div class="dialog-class flex flex-row gap-5">
    <span class="header-class">
      Eliar - {{ t('distributionProcessor.a') }}
    </span>
    <div class="ml-5 mr-5 gap-5 flex flex-row">
      <!-- Incoming joborders table -->
      <div>
        <q-table
          flat
          bordered
          :title="jobordersText"
          :rows="recipe"
          :columns="columnsRecipe"
          row-key="name"
          class="table-header-word-break-override"
          :class="textAlignOverride('left')"
          style="width: 60vw;"
        >
          <template #body="recipe">
            <q-tr
              :class="{ 'selected-row': selectedJobOrderTableRow === recipe.row.reqnumber }"
              style="cursor: pointer;"
              @click="selectRow(recipe.row.reqnumber)"
            >
              <q-td
                v-for="row in recipe.cols"
                :key="row.name"
                :props="recipe"
                :style="`background-color:${rowBGColorHandler(row)}`"
              >
                <span v-if="row.field === 'status'">
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
      <!-- Canceled orders table -->
      <div>
        <q-table
          flat
          bordered
          :title="finishedJobOrderText"
          :rows="canceled"
          :columns="finishedColumns"
          row-key="name"
          :class="textAlignOverride('left')"
          style="width: 35vw;"
        >
          <template #header="props">
            <q-tr :props="props">
              <q-th />
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <template #body="props">
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
                :style="`background-color:${rowBGColorHandler(col)}`"
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
        </q-table>
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
    <span class="header-class">
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
    </div>
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
        <q-btn
          outline
          color="primary"
          :label="hide"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background-color: rgb(42, 62, 92);
  color: white;
  font-size: large;
  width: 100%;
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
