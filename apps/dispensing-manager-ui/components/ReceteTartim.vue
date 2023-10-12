<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { navigateToPage } from '../shared/functions'

const { t } = useI18n()
// async function printKey() {
//   const { data: key } = await useFetch('/api/recipe/joborder?recipeJB=11428')
//   console.log(key.value)
// }

const plannedMachineChangeVal = ref()
const coupledMachineChangeVal = ref()
const isCoupled = ref(false)
const showParameterDialog = ref(false)
const showLogsDialog = ref(false)
const showConsumptionDialog = ref(false)
const lastJobOrder = ref()
const plankey = ref()
// TODO: Job<Typeof Joborder> with plankey joborder correctiion no can be stored
const a = 0
const machines = await $fetch('/api/machine/machines')
// const { data: recipeData, pending: waitingForData } = useFetch('/api/recipe?recipeJB=11428&recipeID=3&teleskopType=normal')
const recipeData = ref()
const jobordernum = ref()
const showChangeMachineDialog = ref(false)
const b = ref()
const buttonProps = ref([
  { name: 'logs', label: t('recipe.logs'), link: 'showLogs', icon: 'description' },
  { name: 'tartim', label: t('recipe.jobOrderMeasurement'), link: 'showConsumptions', icon: 'content_paste_search' },
  { name: 'parameters', label: t('recipe.jobOrderParameters'), link: 'showParameters', icon: 'search' },
  { name: 'tartimrefresh', label: t('recipe.jobOrderMeasurementRefresh'), link: '', icon: 'refresh' },
  { name: 'solvingrefresh', label: t('recipe.jobOrderSolvingRefresh'), link: '', icon: 'refresh' },
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
const correctionNoList = ref([])
const correctionNoDisplayed = ref(0)
const machine = ref([])

async function requestJobOrder() {
  if (jobordernum.value) {
    getCorrectionNOs(jobordernum.value)
    lastJobOrder.value = jobordernum.value
    recipeDataTemp.value = await $fetch(`/api/recipe/joborder?recipeJB=${jobordernum.value}&correctionNo=${correctionNoDisplayed.value}`)
    if (!recipeDataTemp.value)
      recipeData.value = []
    else {
      recipeData.value = recipeDataTemp.value
      recipeData.value.map(row => row.unit = t(`units.${row.unit}`))
      plankey.value = recipeData.value[0].planKey

      if (!correctionNoDisplayed.value) {
        const tempNo = await $fetch(`/api/recipe/correction-number-by-parameter?parameter=${jobordernum.value}&searchBy=planKey`)
        correctionNoDisplayed.value = tempNo[0].CORRECTIONNUMBER
      }
    }
    const tempMach = await $fetch(`/api/machine/machine?joborder=${jobordernum.value}&correctionNo=${correctionNoDisplayed.value}`)
    machine.value = tempMach
    console.log(machine.value)
  } else {
    recipeData.value = []
  }
}

function clearCorrectionNo() {
  correctionNoDisplayed.value = 0
}

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
if (urlParams.get('correctionNo') && urlParams.get('joborder')) {
  jobordernum.value = urlParams.get('joborder')
  correctionNoDisplayed.value = Number(urlParams.get('correctionNo'))
  await requestJobOrder()
}

function changePlannedMachine() {
  /**
   * Call put method I guess to change the machine that joborder is planned
   */
}

function buttonAction(link: string) {
  if (link === 'showParameters' && lastJobOrder.value) {
    showParameterDialog.value = true
  }
  if (link === 'showLogs') {
    showLogsDialog.value = true
  }
  if (link === 'showConsumptions') {
    showConsumptionDialog.value = true
  }
}
</script>

<template>
  <!-- <button class="w-50 h-50 e-border" @click="getCorrectionNOs('11428', 'planKey')">
    1
  </button> -->

  <div class="flex flex-col gap-5">
    <span class="header-class-recipe">
      {{ t('distributionProcessor.a') }} - {{ t('recipe.header') }}
    </span>
    <div class="ml-5">
      {{ t('recipe.infoText') }}
      <div class="flex flex-row items-center gap-5">
        {{ t('joborderNo') }}
        <q-input
          v-model="jobordernum"
          clearable
          @vue:updated="clearCorrectionNo()"
        />
        <q-btn :label="t('request')" @click="requestJobOrder()" />
        {{ plankey }} --> Joborder: 84956 can be used as an example
      </div>
      <div class="flex flex-row items-center gap-5 mt-2">
        {{ t('correctionNo') }}
        <q-select
          v-model="correctionNoDisplayed"
          class="w-40"
          filled
          :options="correctionNoList"
        />
        <q-btn :label="t('allJobOrders')" @click="navigateToPage('registered-job-orders')" />
      </div>
    </div>
    <span class="header-class-recipe">
      {{ t('recipe.recipeInfo') }}
    </span>
    <div class="ml-5">
      {{ t('plannedMachine') }} :
      {{ machine[0]?.machinename }}
      <q-btn
        class="ml-5"
        :label="`${t('recipe.changePlannedMachine')}`"
        icon="published_with_changes"
        @click="showChangeMachineDialog = true"
      />
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
          {{ t('currentMachine') }} : {{ machine[0].machinename }}
          <q-select
            v-model="plannedMachineChangeVal"
            :options="machines"
            option-label="machinename"
            :label="t('plannedMachine')"
            style="width: 50%;"
          />

          <q-checkbox v-model="isCoupled" :label="t('recipe.joborderCoupled')" />

          <q-select
            v-model="coupledMachineChangeVal"
            :disable="!isCoupled"
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
            color="primary"
          />
          <q-btn
            v-close-popup
            flat
            :label="t('close')"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="showParameterDialog"
      full-height
    >
      <ParameterDialogContent :joborder="Number(lastJobOrder)" :plankey="plankey" />
    </q-dialog>
    <q-dialog
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
      <ConsumptionDialogContent :joborder="Number(lastJobOrder)" :machinename="machine[0].machinename" />
    </q-dialog>
    <ElScrollbar class="table-wrapper-recipe ml-5 mr-5">
      <RecipeTable
        :data="recipeData"
        :show="true"
        title="Recipe Table"
        :is-first="true"
        :settings="a"
      />
    </ElScrollbar>
    <div class="footer-buttons-recipe gap-5">
      <q-btn
        v-for="button of buttonProps"
        :key="button.name"
        class="e-border"
        outline
        color="primary"
        :label="button.label"
        :icon="button.icon"
        @click="buttonAction(button.link)"
      />
      <!-- TODO: button operations function that decides what t2o do it can be refresh or redirect to another page  -->
    </div>
  </div>
</template>

<style scoped>
.header-class-recipe {
  background-color: rgb(42, 62, 92);
  color: white;
  font-size: large;
  width: 100vw;
  padding-left: 1%;
}
.table-wrapper-recipe {
  grid-area: table;
  width: 100vw;
  max-width: 100vw;
  height: 50vh;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}
.footer-buttons-recipe {
  background-color: rgb(236, 236, 236);
  position:static;
  height: 10vh;
  width: 100vw;
  bottom: 0px;
  right: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
