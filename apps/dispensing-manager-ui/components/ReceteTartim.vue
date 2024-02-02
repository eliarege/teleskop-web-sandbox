<script setup lang="ts">
import { Notify } from 'quasar'
import { navigateToPage, notification } from '../shared/functions'
import RecipeTable from '../../../packages/nuxt-ui/components/RecipeTable.vue'
import type { RecipeLatest } from '~/shared/types'

const { t } = useI18n()

const plannedMachineChangeVal = ref()
const coupledMachineChangeVal = ref()
const isCoupled = ref(false)
const isThereAnyLog = ref(true)
const showParameterDialog = ref(false)
const showLogsDialog = ref(false)
const showConsumptionDialog = ref(false)
const lastJobOrder = ref()
const plankey = ref()
const showJoborderError = ref(false)
const resetCounter = ref(0)
const showWeiRequestDialog = ref(false)
const materialRows = ref([])
// TODO: Job<Typeof Joborder> with plankey joborder correctiion no can be stored
const machines = await $fetch('/api/machine/machines')
// const { data: recipeData, pending: waitingForData } = useFetch('/api/recipe?recipeJB=11428&recipeID=3&teleskopType=normal')
const recipeData = ref()
const jobordernum = ref()
const showChangeMachineDialog = ref(false)
const correctionNoList = ref([])

const groupables: Array<{ key: keyof RecipeLatest, index: number }> = [
  { key: 'processOrder', index: 0 },
  { key: 'recipeType', index: 1 },
  { key: 'programNo', index: 2 },
  { key: 'programName', index: 3 },
  { key: 'ISN', index: 4 },
  { key: 'mainStep', index: 5 },
  { key: 'parallelStep', index: 6 },
]

const columns = [
  { label: t('recipe.processOrder'), prop: 'processOrder', align: 'center', showOverflowTooltip: true },
  { label: t('recipeType'), prop: 'recipeTypeText', align: 'center', showOverflowTooltip: true },
  { label: t('programNo'), prop: 'programNo', align: 'center', showOverflowTooltip: true },
  { label: t('programName'), prop: 'programName', align: 'center', showOverflowTooltip: true },
  { label: t('recipe.ISN'), prop: 'ISN', align: 'center', showOverflowTooltip: true },
  { label: t('recipe.mainStep'), prop: 'mainStep', align: 'center', showOverflowTooltip: true },
  { label: t('weighingInformation.parallelStep'), prop: 'parallelStep', align: 'center', showOverflowTooltip: true },
  { label: t('materialCode'), prop: 'chemCode', align: 'center', showOverflowTooltip: true },
  { label: t('materialName'), prop: 'materialName', align: 'center', showOverflowTooltip: true },
  { label: t('recipe.processNo'), prop: 'programProcessNo', align: 'center', showOverflowTooltip: true },
  { label: t('recipe.amount'), prop: 'amount', align: 'center', showOverflowTooltip: true },
  { label: t('recipe.metric'), prop: 'unit', align: 'center', showOverflowTooltip: true },
]

const buttonProps = ref([
  { name: 'logs', label: t('recipe.logs'), link: 'showLogs', icon: 'description' },
  { name: 'tartim', label: t('recipe.jobOrderMeasurement'), link: 'showConsumptions', icon: 'content_paste_search' },
  { name: 'parameters', label: t('recipe.jobOrderParameters'), link: 'showParameters', icon: 'search' },
  { name: 'tartimrefresh', label: t('recipe.jobOrderMeasurementRefresh'), link: 'tartimrefresh', icon: 'refresh' },
  { name: 'solvingrefresh', label: t('recipe.jobOrderSolvingRefresh'), link: 'solvingrefresh', icon: 'refresh' },
])

async function getCorrectionNOs(parameter: string) {
  const correctionListTemp = await $fetch(`/api/recipe/correction-number-by-parameter?parameter=${parameter}&searchBy=recipeJB`)
  correctionNoList.value = []
  correctionListTemp.forEach((element: { CORRECTIONNUMBER: number }) => correctionNoList.value.push(element.CORRECTIONNUMBER))
}

/**
 * TODO:
 * Have to have the machine that joborder is running
 * Have to have joborder of the recipe
 * Might to have colors array
 */
const recipeDataTemp = ref()
const correctionNoDisplayed = ref(0)
const machine = ref()
const currentRecipeJoborder = ref('0')

function resetValues() {
  recipeData.value = []
  machine.value = null
  currentRecipeJoborder.value = ''
  correctionNoDisplayed.value = 0
  recipeDataTemp.value = null
  lastJobOrder.value = null
  plankey.value = 0
  console.log(plankey.value)
  jobordernum.value = null
  materialRows.value = []
}

async function requestManuelMaterials() {
  materialRows.value = await $fetch('/api/recipe/recipe-manuals', {
    method: 'POST',
    body: {
      plankey: plankey.value,
      correctionNo: correctionNoDisplayed.value,
    },
  })
  console.log(materialRows.value)
  materialRows.value.forEach((row: any) => {
    row.unit = t(`units.${row.unit}`)
    row.recipeTypeText = t(`recipeTypes.${row.recipeType}`)
  })
}

async function requestJobOrder() {
  resetCounter.value += 1
  if (jobordernum.value) {
    showJoborderError.value = false
    currentRecipeJoborder.value = jobordernum.value
    getCorrectionNOs(currentRecipeJoborder.value)
    lastJobOrder.value = currentRecipeJoborder.value
    recipeDataTemp.value = await $fetch(`/api/recipe/joborder?recipeJB=${currentRecipeJoborder.value}&correctionNo=${correctionNoDisplayed.value}`)
    console.log(recipeDataTemp)
    if (!recipeDataTemp.value.length) {
      resetValues()
      Notify.create({
        message: t('recipe.noRecipeText'),
        color: 'red',
        position: 'top',
      })
    } else {
      if (!correctionNoDisplayed.value) {
        const tempNo = await $fetch(`/api/recipe/correction-number-by-parameter?parameter=${currentRecipeJoborder.value}&searchBy=planKey`)
        correctionNoDisplayed.value = tempNo[0].CORRECTIONNUMBER
      }
      recipeData.value = recipeDataTemp.value
      plankey.value = recipeData.value[0].planKey
      await requestManuelMaterials()
      recipeData.value.forEach((row) => {
        row.unit = t(`units.${row.unit}`)
        row.recipeTypeText = t(`recipeTypes.${row.recipeType}`)
      })
    }
    const tempMach = await $fetch(`/api/machine/machine?joborder=${currentRecipeJoborder.value}&correctionNo=${correctionNoDisplayed.value}`)
    machine.value = tempMach
  } else {
    resetValues()
    showJoborderError.value = true
    Notify.create({
      message: t('recipe.infoText'),
      color: 'red',
      position: 'top',
    })
  }
  isThereAnyLog.value = await checkIsThereAnyLog(plankey.value)
}

function clearCorrectionNo() {
  correctionNoDisplayed.value = 0
}

async function checkIsThereAnyLog(plankey) {
  const check = await $fetch('/api/logs/check-if-log-exists', {
    method: 'post',
    body: {
      plankey,
    },
  })
  return check
}

const route = useRoute()
if (route.query.correctionNo && route.query.joborder) {
  jobordernum.value = route.query.joborder
  correctionNoDisplayed.value = Number(route.query.correctionNo)
  await requestJobOrder()
  if (route.query.isLogs === 'true') {
    if (isThereAnyLog.value)
      showLogsDialog.value = true
    else
      notification(false, t('warnings.noDataLogs', { joborder: jobordernum.value }))
  }
}

function buttonAction(link: string) {
  if (lastJobOrder.value) {
    if (link === 'showParameters') {
      showParameterDialog.value = true
    }
    if (link === 'showLogs') {
      showLogsDialog.value = true
      if (!isThereAnyLog.value) {
        notification(false, t('warnings.noDataLogs', { joborder: jobordernum.value }))
      }
    }
    if (link === 'showConsumptions') {
      showConsumptionDialog.value = true
    }
    if (link === 'tartimrefresh') {
      showWeiRequestDialog.value = true
    }
  }
}

async function submitCoupleMachine() {
  const check = await $fetch('/api/recipe/change-planned-machine', {
    method: 'put',
    body: {
      plankey: plankey.value,
      newPlannedMachine: plannedMachineChangeVal.value.machineid,
      isCoupled: isCoupled.value,
      newCoupleMachine: coupledMachineChangeVal.value?.machineid,
    },
  })
  if (check)
    machine.value = plannedMachineChangeVal.value
}

const programs = ref()

async function rerequestWei() {
  // TODO: Daha düzgün bir implementasyon bul.
  programs.value = await $fetch('/api/recipe/programs-by-plankey', {
    method: 'POST',
    body: {
      plankey: plankey.value,
    },
  })
  programs.value.forEach((program) => {
    recipeData.value.forEach((row) => {
      if (program.programNo === row.programNo && program.recipeType === row.recipeType) {
        if (!program.materialCodes)
          program.materialCodes = []
        program.materialCodes.push(row.chemCode)
        program.row = row
      }
    })
  })

  programs.value.forEach(async (program) => {
    if (program.materialCodes.length) {
      const data = [
        2,
        50,
        machine.value.machineid,
        0,
        program.row.joborder,
        program.row.programNo,
        program.row.mainStep,
        program.row.mainStep,
        program.materialCodes.length,
        program.row.recipeType,
        program.row.processOrder,
      ]
      await $fetch('/api/file/write-recipe-step', {
        method: 'POST',
        body: {
          machineid: machine.value.machineid,
          materialCodes: ['BAKR01', 'BAKR02', 'BAKR03'],
          checkMachineDispenser: true,
          checkMaterialDispenser: true,
          dispenserType: 2,
          content: data,
          row: program.row,
        },
      })
    }
  })
}

const isCoupledTheSame = computed(() => {
  return plannedMachineChangeVal.value?.machineid && coupledMachineChangeVal.value?.machineid && plannedMachineChangeVal.value?.machineid === coupledMachineChangeVal.value?.machineid
})

async function handleKeyUp(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    await requestJobOrder()
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
  <!-- <button class="w-50 h-50 e-border" @click="getCorrectionNOs('11428', 'planKey')">
    1
  </button> -->

  <div class="outer-div">
    <div class="content flex flex-col gap-5">
      <span class="header-class-recipe">
        <NavigationButton type="back" />
        &nbsp;&nbsp;
        {{ t('dispensingManager._') }} - {{ t('recipe.header') }}
        <span class="right-home">
          <NavigationButton type="settings" />
          <NavigationButton type="home" />
        </span>
      </span>
      <div class="ml-5">
        <!-- {{ t('recipe.infoText') }} -->
        <div class="flex flex-row items-center gap-5">
          <!-- {{ t('joborderNo') }}
          <q-input
            v-model="jobordernum"
            clearable
            style="width: 10%;"
            /> -->
          <q-input
            v-model="jobordernum"
            outlined
            class="joborder-font"
            :label="t('joborderNo')"
            dense
            :error="showJoborderError"
            hide-bottom-space
            @vue:updated="clearCorrectionNo()"
          />
          <q-btn
            :label="t('request')"
            icon="search"
            class="py-2"
            @click="requestJobOrder()"
          />
          {{ plankey }}
          <q-btn
            class="ml-auto mr-5 py-3 w-75 items-start"
            :label="t('allJobOrders')"
            icon="search"
            @click="navigateToPage('registered-job-orders')"
          />
        </div>
      </div>
      <span class="header-class-recipe pl-4">
        {{ t('recipe.recipeInfo') }}
      </span>
      <div class="flex ml-5 gap-5 items-center text-bold">
        {{ `${t('joborderNo')}: ${currentRecipeJoborder}` }} &nbsp; - &nbsp;
        {{ `${t('correctionNo')}:` }}
        <q-select
          v-model="correctionNoDisplayed"
          class="w-20"
          filled
          dense
          hide-bottom-space
          :options="correctionNoList"
          @update:model-value="requestJobOrder()"
        />
        <div class="ml-auto items-center mr-5">
          {{ t('plannedMachine') }} :
          {{ machine?.machinename }}
          <q-btn
            class="ml-5 py-3 w-75 items-start"
            :label="`${t('recipe.changePlannedMachine')}`"
            icon="published_with_changes"
            @click="showChangeMachineDialog = true"
          />
        </div>
      </div>
      <!-- Machine Change Dialog -->
      <q-dialog v-model="showChangeMachineDialog">
        <q-card class="w-400">
          <q-card-section>
            <div class="text-h6">
              {{ t('recipe.machineChange') }}
            </div>
          </q-card-section>

          <q-card-section class="flex flex-col gap-5" style="justify-content: center; align-items: center;">
            {{ t('currentMachine') }} : {{ machine.machinename }}
            <q-select
              v-model="plannedMachineChangeVal"
              :options="machines"
              option-label="machinename"
              :error="isCoupledTheSame || plannedMachineChangeVal?.machineid === machine.machineid"
              :error-message="isCoupledTheSame ? t('warnings.coupledMachineIsTheSame') : plannedMachineChangeVal?.machineid === machine.machineid ? t('warnings.tryToChangeWithSameMachine') : ''"
              :label="t('plannedMachine')"
              style="width: 50%;"
            />

            <q-checkbox
              v-model="isCoupled"
              :label="t('recipe.joborderCoupled')"
              @update:model-value="isCoupled === false ? coupledMachineChangeVal = null : ''"
            />

            <q-select
              v-model="coupledMachineChangeVal"
              :error="isCoupledTheSame"
              :disable="!isCoupled"
              :error-message="t('warnings.coupledMachineIsTheSame')"
              :options="machines"
              option-label="machinename"
              :label="t('recipe.coupleMachine')"
              style="width: 50%;"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              :label="t('submit')"
              :disable="isCoupledTheSame"
              color="black"
              @click="submitCoupleMachine()"
            />
            <q-btn
              v-close-popup
              flat
              :label="t('close')"
              color="black"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog
        v-model="showParameterDialog"
        full-height
        full-width
      >
        <ParameterDialogContent :joborder="Number(lastJobOrder)" :plankey="plankey" />
      </q-dialog>
      <q-dialog
        v-if="isThereAnyLog"
        v-model="showLogsDialog"
        full-height
        full-width
      >
        <LogsDialogContent :joborder="Number(lastJobOrder)" :plankey="plankey" />
      </q-dialog>
      <q-dialog
        v-model="showConsumptionDialog"
        full-height
        full-width
      >
        <ConsumptionDialogContent
          :joborder="lastJobOrder"
          :machinename="machine.machinename"
          :correction-no="correctionNoDisplayed"
        />
      </q-dialog>
      <q-dialog v-model="showWeiRequestDialog" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar
              icon="help"
              color="white"
            />
            {{ t('recipe.weiRerequest') }}
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
              @click="rerequestWei()"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <ElScrollbar class="table-wrapper-recipe">
        <RecipeTableDMW
          :data="recipeData"
          :columns="columns"
          :groupables="groupables"
          :show="true"
          :title="t('recipe.recipeTable')"
          :machineid="machine?.machineid"
          :reset-counter="resetCounter"
        />
      </ElScrollbar>
    </div>

    <div>
      <RecipeTable
        v-if="materialRows.length > 0"
        :title="t('recipe.manuelMaterials')"
        :rows="materialRows"
        :columns="columns"
        :groupables="groupables"
        dyeing-class="text-black"
      />
    </div>

    <div class="footer-buttons-recipe">
      <q-btn
        v-for="button of buttonProps"
        :key="button.name"
        class="footer-button"
        outline
        :disabled="!plankey"
        color="black"
        @click="buttonAction(button.link)"
      >
        <q-icon
          class="button-icon"
          :name="button.icon"
        />
        <span class="button-text">

          {{ button.label }}
        </span>
      </q-btn>
    </div>
    <!-- TODO: button operations function that decides what t2o do it can be refresh or redirect to another page  -->
  </div>
</template>

<style scoped>
@media (min-width: 601px) and (max-width: 1200px) {
  .button-icon {
    display: none;
  }
}

@media (max-width: 600px) {
  .footer-button {
    font-size: xx-small;
  }
  .header-class-recipe {
    font-size: medium !important;
  }

  .button-text {
    display: none;
  }
}

.text-bold {
  font-size: large;
}
.custom-error-size :deep(.q-field__messages) {
  font-size: 14px; /* Set your desired font size */
}

.middle-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 5px;
}

.left-middle-bar {
  grid-area: 1 / 1 / 2 / 2;
}
.table-header {
  font-size: large;
  grid-area: 1 / 2 / 2 / 4;
}
.header-class-recipe {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  height: 3rem;
}

.right-home {
  position: absolute;
  right: 0;
}
.table-wrapper-recipe {
  grid-area: table;
  width: 100%;
  max-width: 100%;
  height: 50%;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
.footer-buttons-recipe {
  background-color: rgb(255, 255, 255);
  z-index: 1;
  display: flex;
  position: sticky;
  bottom: 0;
  width: 100%;
  height: 5rem;
  justify-content: center;
}
.content{
  flex: 1;
  padding-bottom: 1rem;
}
.outer-div{
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.footer-button{
  margin: 1rem;
  margin-bottom: 1rem;
  overflow: hidden;
}
</style>
