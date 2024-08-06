<script setup lang="ts">
import { Notify } from 'quasar'
import { navigateToPage, notification } from '../shared/functions'
import type { RecipeLatest } from '~/shared/types'
import RefreshConfirmationDialog from '~/components/RefreshConfirmationDialog.vue'

const keycloak = useKeycloak()
const { t } = useI18n()
const $q = useQuasar()
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
const materialRows = ref([])
const machines = await keycloak.fetch('/api/machine/machines')
const recipeData = ref()
const jobordernum = ref()
const showChangeMachineDialog = ref(false)
const correctionNoList = ref([])
const correctionNoDisplayed = ref(0)
const isLastCorrectionNo = computed(() => {
  if (correctionNoList.value.length)
    return correctionNoList?.value[correctionNoList.value.length - 1] === correctionNoDisplayed.value
  return true
})
const hasManagerRole = computed(() => {
  return keycloak.hasResourceRole('manage')
})
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
  {
    label: () => t('recipe.processOrder'),
    prop: 'processOrder',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipeType'),
    prop: 'recipeTypeText',
    align: 'center',
    showOverflowTooltip: true,
    formatter: (row: any) => t(`recipeTypes.${row.recipeType}`),
  },
  {
    label: () => t('programNo'),
    prop: 'programNo',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('programName'),
    prop: 'programName',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.ISN'),
    prop: 'ISN',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.mainStep'),
    prop: 'mainStep',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('weighingInformation.parallelStep'),
    prop: 'parallelStep',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('materialCode'),
    prop: 'chemCode',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('materialName'),
    prop: 'materialName',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.processNo'),
    prop: 'programProcessNo',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.amount'),
    prop: 'amount',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.recipeAmount'),
    prop: 'recipeAmount',
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    label: () => t('recipe.metric'),
    prop: 'unit',
    align: 'center',
    showOverflowTooltip: true,
    formatter: (row: any) => t(`units.${row.unit}`),
  },
]

const buttonProps = ref([
  {
    name: 'logs',
    label: t('recipe.logs'),
    link: 'showLogs',
    icon: 'description',
    authorized: true,
  },
  {
    name: 'weighing',
    label: t('recipe.jobOrderMeasurement'),
    link: 'showConsumptions',
    icon: 'content_paste_search',
    authorized: true,
  },
  {
    name: 'parameters',
    label: t('recipe.jobOrderParameters'),
    link: 'showParameters',
    icon: 'search',
    authorized: true,
  },
  {
    name: 'weighingRefresh',
    label: t('recipe.jobOrderMeasurementRefresh'),
    link: 'weighingRefresh',
    icon: 'refresh',
    authorized: hasManagerRole,
  },
  {
    name: 'solvingRefresh',
    label: t('recipe.jobOrderSolvingRefresh'),
    link: 'solvingRefresh',
    icon: 'refresh',
    authorized: hasManagerRole,
  },
])

async function getCorrectionNOs(parameter: string) {
  const correctionListTemp = await keycloak.fetch(`/api/recipe/correction-number-by-parameter?parameter=${parameter}&searchBy=recipeJB`)
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
  jobordernum.value = null
  materialRows.value = []
}

async function requestManuelMaterials() {
  materialRows.value = await keycloak.fetch('/api/recipe/recipe-manuals', {
    method: 'POST',
    body: {
      plankey: plankey.value,
      correctionNo: correctionNoDisplayed.value,
    },
  })
  materialRows.value.forEach((row: any) => {
    // row.unit = t(`units.${row.unit}`)
    const mainStep = row.mainStep
    const ISN = row.ISN
    row.mainStep = ISN ? `${ISN - 1} <-> ${ISN}` : 0
    row.ISN = mainStep ? `${mainStep - 1} <-> ${mainStep}` : 0
  })
}

async function requestJobOrder() {
  resetCounter.value += 1
  if (jobordernum.value) {
    showJoborderError.value = false
    currentRecipeJoborder.value = jobordernum.value
    getCorrectionNOs(currentRecipeJoborder.value)
    lastJobOrder.value = currentRecipeJoborder.value
    recipeDataTemp.value = await keycloak.fetch('/api/recipe/joborder', {
      query: {
        recipeJB: currentRecipeJoborder.value,
        correctionNo: correctionNoDisplayed.value,
      },
    })
    if (!recipeDataTemp.value.length) {
      resetValues()
      Notify.create({
        message: t('recipe.noRecipeText'),
        color: 'red',
        position: 'top',
      })
    } else {
      if (!correctionNoDisplayed.value) {
        const tempNo = await keycloak.fetch(`/api/recipe/correction-number-by-parameter?`, {
          query: {
            parameter: currentRecipeJoborder.value,
            searchBy: 'planKey',
          },
        })
        correctionNoDisplayed.value = tempNo[0].CORRECTIONNUMBER
      }
      recipeData.value = recipeDataTemp.value
      plankey.value = recipeData.value[0].planKey
      await requestManuelMaterials()
      // recipeData.value.forEach((row) => {
      //   // row.unit = t(`units.${row.unit}`)
      //   // row.recipeTypeText = t(`recipeTypes.${row.recipeType}`)
      // })
    }
    const tempMach = await keycloak.fetch(`/api/machine/machine?`, {
      query: {
        joborder: currentRecipeJoborder.value,
        correctionNo: correctionNoDisplayed.value,
      },
    })
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

function clearCorrectionNo(event) {
  jobordernum.value = event
  correctionNoDisplayed.value = 0
}

async function checkIsThereAnyLog(plankey) {
  const check = await keycloak.fetch('/api/stepLogs/check-if-log-exists', {
    query: {
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
      notification(false, t('warnings.noJobOrderLogs', { joborder: jobordernum.value }))
  }
}

function buttonAction(link: string) {
  if (lastJobOrder.value) {
    if (link === 'showParameters') {
      showParameterDialog.value = true
    }
    if (link === 'showLogs') {
      if (!isThereAnyLog.value) {
        notification(false, t('warnings.noJobOrderLogs', { joborder: jobordernum.value }))
      } else {
        showLogsDialog.value = true
      }
    }
    if (link === 'showConsumptions') {
      showConsumptionDialog.value = true
    }
    if (link === 'weighingRefresh') {
      handleRefresh('weighing')
    }
    if (link === 'solvingRefresh') {
      handleRefresh('solving')
    }
  }
}
function handleRefresh(refreshType: 'solving' | 'weighing') {
  $q.dialog({
    component: RefreshConfirmationDialog,
    componentProps: {
      refreshType,
    },
  }).onOk(async () => {
    const res = await keycloak.fetch(`/api/recipe/refresh-${refreshType}-requests/${plankey.value}`, { method: 'POST' })
    notification(res, t(`recipe.refresh.${refreshType}.${res ? 'success' : 'fail'}`))
  })
}
async function submitCoupleMachine() {
  const check = await keycloak.fetch('/api/recipe/change-planned-machine', {
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
      <div class="ml-5">
        <!-- {{ t('recipe.infoText') }} -->
        <div class="flex flex-row items-center gap-5 pt-5">
          <!-- {{ t('joborderNo') }}
          <q-input
            v-model="jobordernum"
            clearable
            style="width: 10%;"
            /> -->
          <q-input
            :model-value="jobordernum"
            outlined
            class="joborder-font"
            :label="t('joborderNo')"
            dense
            :error="showJoborderError"
            hide-bottom-space
            @update:model-value="clearCorrectionNo"
          />
          <q-btn
            :label="t('request')"
            icon="search"
            :disable="!jobordernum"
            class="py-2"
            @click="requestJobOrder()"
          />
          {{ plankey }}
          <q-space />
          <div class="flex text-size-8 mr-5" style="color: red">
            {{ !isLastCorrectionNo ? t('warnings.deleted') : '' }}
          </div>
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
          :disabled="!plankey"
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
            :disabled="!plankey"
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
      <ElScrollbar class="table-wrapper-recipe">
        <RecipeTableDMW
          :data="recipeData"
          :columns="columns"
          :groupables="groupables"
          :show="true"
          :title="t('recipe.recipeTable')"
          :machineid="machine?.machineid"
          :reset-counter="resetCounter"
          :have-context-menu="isLastCorrectionNo"
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
    <q-space />
    <div class="footer-buttons-recipe">
      <q-btn
        v-for="button of buttonProps"
        :key="button.name"
        class="footer-button"
        outline
        :disabled="!plankey || !button.authorized"
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
  font-size: large;
  width: 100%;
  display: flex;
  align-items: center;
  height: 2.5rem;
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
.text-override-left :deep(.text-right) {
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
.content {
  padding-bottom: 2rem;
}
.outer-div {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.footer-button {
  margin: 1rem;
  margin-bottom: 1rem;
  overflow: hidden;
}
</style>
