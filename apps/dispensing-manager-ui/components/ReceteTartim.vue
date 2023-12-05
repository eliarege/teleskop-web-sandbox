<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { navigateToPage } from '../shared/functions'

const { t } = useI18n()

const plannedMachineChangeVal = ref()
const coupledMachineChangeVal = ref()
const isCoupled = ref(false)
const showParameterDialog = ref(false)
const showLogsDialog = ref(false)
const showConsumptionDialog = ref(false)
const lastJobOrder = ref()
const plankey = ref()
const showJoborderError = ref(false)
// TODO: Job<Typeof Joborder> with plankey joborder correctiion no can be stored
const a = 0
const machines = await $fetch('/api/machine/machines')
// const { data: recipeData, pending: waitingForData } = useFetch('/api/recipe?recipeJB=11428&recipeID=3&teleskopType=normal')
const recipeData = ref()
const jobordernum = ref()
const showChangeMachineDialog = ref(false)
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
const currentRecipeJoborder = ref('0')

async function requestJobOrder() {
  if (jobordernum.value) {
    showJoborderError.value = false
    currentRecipeJoborder.value = jobordernum.value
    getCorrectionNOs(currentRecipeJoborder.value)
    lastJobOrder.value = currentRecipeJoborder.value
    recipeDataTemp.value = await $fetch(`/api/recipe/joborder?recipeJB=${currentRecipeJoborder.value}&correctionNo=${correctionNoDisplayed.value}`)
    if (!recipeDataTemp.value)
      recipeData.value = []
    else {
      recipeData.value = recipeDataTemp.value
      recipeData.value.forEach((row) => {
        row.unit = t(`units.${row.unit}`)
        row.recipeTypeText = t(`recipeTypes.${row.recipeType}`)
      })
      plankey.value = recipeData.value[0].planKey

      if (!correctionNoDisplayed.value) {
        const tempNo = await $fetch(`/api/recipe/correction-number-by-parameter?parameter=${currentRecipeJoborder.value}&searchBy=planKey`)
        correctionNoDisplayed.value = tempNo[0].CORRECTIONNUMBER
      }
    }
    const tempMach = await $fetch(`/api/machine/machine?joborder=${currentRecipeJoborder.value}&correctionNo=${correctionNoDisplayed.value}`)
    machine.value = tempMach
  } else {
    recipeData.value = []
    showJoborderError.value = true
    Notify.create({
      message: t('recipe.infoText'),
      color: 'red',
      position: 'top',
    })
  }
}

function clearCorrectionNo() {
  correctionNoDisplayed.value = 0
}

const route = useRoute()
console.log(route.query)
if (route.query.correctionNo && route.query.joborder) {
  if (route.query.isLogs === 'true')
    showLogsDialog.value = true
  jobordernum.value = route.query.joborder
  correctionNoDisplayed.value = Number(route.query.correctionNo)
  await requestJobOrder()
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

async function submitCoupleMachine() {
  await $fetch('/api/recipe/change-planned-machine', {
    method: 'put',
    body: {
      plankey: plankey.value,
      newPlannedMachine: plannedMachineChangeVal.value.machineid,
      isCoupled: isCoupled.value,
      newCoupleMachine: coupledMachineChangeVal.value?.machineid,
    },
  })
}
</script>

<template>
  <!-- <button class="w-50 h-50 e-border" @click="getCorrectionNOs('11428', 'planKey')">
    1
  </button> -->

  <div class="outer-div ">
    <div class="content flex flex-col gap-5">
      <span class="header-class-recipe">
        <NavigationButton type="back" />
        &nbsp;&nbsp;
        {{ t('distributionProcessor._') }} - {{ t('recipe.header') }}
        <span class="right-home">
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
          {{ plankey }} Joborder: 84956 can be used as an example
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
          {{ machine[0]?.machinename }}
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
          :machinename="machine[0].machinename"
          :correction-no="correctionNoDisplayed"
        />
      </q-dialog>
      <ElScrollbar class="table-wrapper-recipe">
        <RecipeTable
          :data="recipeData"
          :show="true"
          :title="t('recipe.recipeTable')"
          :is-first="true"
        />
      </ElScrollbar>
    </div>

    <div class="footer-buttons-recipe">
      <q-btn
        v-for="button of buttonProps"
        :key="button.name"
        class="footer-button"
        outline
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
}
</style>
