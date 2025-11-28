<script lang="ts" setup>
import ConfirmationDialog from '../ConfirmationDialog.vue'
import { RecipeType } from '~/shared/constants'
import type { CommandParameter, Customer, FabricType, JobOrderParams, Machine, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster, RecipeVariant } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { useDataStore } from '~/store/DataStore'
import { useStateStore } from '~/store/State'

const props = defineProps({
  recipeId: {
    type: Number,
    required: false,
  },
  machineId: {
    type: Number,
    required: false,
  },
  variant: {
    type: Object as PropType<RecipeVariant>,
    required: false,
  },
})
const q = useQuasar()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const { t } = useI18n()

const selectedRecipe = ref<RecipeMasterStep[]>([])
const selectedMachines = ref<Machine[]>([])
const recipeHeader = ref<RecipeProgramMaster>()
const jobOrderParams = ref<JobOrderParams>({
  jobNo: '1',
  numberOfJobs: 1,
  totalWeight: 20,
  flotteRatio: 1,
  flotte: 20,
  partyNo: 1,
  orderNo: 1,
  notes: '',
  customerName: '',
  fabricType: '',
  yarn: '',
  ASNo: '',
})
const dataStore = useDataStore()
const colorStore = useColorStore()
const stateStore = useStateStore()
const createMultiple = ref(false)
const programWeightsEnabled = ref(false)
const printWhenDone = ref(true)
const flotte = computed(() => jobOrderParams.value.flotteRatio! * jobOrderParams.value.totalWeight)
const customers = ref<Customer[]>([])
const fabricTypes = ref<FabricType[]>([])
const parameters = ref<Record<number, CommandParameter[]>>({})
const { notifyFail } = useNotify()
const columns = [
  { name: 'orderNo', label: t('recipeFields.OrderNo'), align: 'left', field: 'orderNo' },
  { name: 'type', label: t('materialFields.Type'), align: 'left', field: 'type' },
  { name: 'isManual', label: t('recipeFields.AutoMan'), align: 'left', field: 'isManual' },
  { name: 'materialCode', label: t('materialFields.Code'), align: 'left', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'left', field: 'materialName' },
  { name: 'amount', label: t('Amount'), align: 'left', field: 'amount' },
  { name: 'unit', label: t('jobOrderParams.Unit'), align: 'left', field: 'unit' },
  { name: 'calculated', label: t('jobOrderParams.Calculated'), align: 'left', field: 'calculated' },
]
const recipes = ref<RecipeProgramMaster[]>([])
const machines = ref<Machine[]>([])

const showAddCustomerDialog = ref(false)
const showAddFabricDialog = ref(false)
const newCustomerName = ref('')
const newFabricName = ref('')
const activeTabs = ref<Record<number, 'materials' | 'commands'>>({})
const CAPACITY_THRESHOLD = 0.1
const recipeFilter = ref('')
const showRecipeOptions = ref(false)
const selectedRecipeLabel = ref('')

const filteredRecipes = computed(() => {
  if (!recipeFilter.value) {
    return recipes.value
  }
  const filterLower = recipeFilter.value.toLowerCase()
  return recipes.value.filter(recipe =>
    getRecipeLabel(recipe).toLowerCase().includes(filterLower)
    || recipe.recipeId.toString().includes(filterLower)
    || recipe.recipeName.toLowerCase().includes(filterLower)
    || recipe.machineId.toString().includes(filterLower),
  )
})

function setProgramDefaultTabs() {
  for (const prog of selectedRecipe.value) {
    if (!activeTabs.value[prog.programNo]) {
      activeTabs.value[prog.programNo] = 'materials'
    }
  }
}

function selectRecipe(recipe: RecipeProgramMaster) {
  selectedRecipeLabel.value = getRecipeLabel(recipe)
  recipeFilter.value = selectedRecipeLabel.value
  updateRecipe(recipe)
  showRecipeOptions.value = false
}

function onRecipeInputChange(val: string | number | null) {
  if (typeof val !== 'string')
    return
  showRecipeOptions.value = true
  if (val !== selectedRecipeLabel.value) {
    selectedRecipeLabel.value = ''
  }
}

function onRecipeFocus() {
  showRecipeOptions.value = true
}
// getMachines()
getRecipes()
getDefaultBatchNo()
getAdditonalData()

async function getRecipes() {
  recipes.value = await $fetch('/api/recipes/master',
  // { query: { machineId: stateStore.defaultMachine } }

  )
  if (props.recipeId && props.machineId)
    updateRecipe(recipes.value.find(recipe => recipe.recipeId === props.recipeId && recipe.machineId === props.machineId))
}
async function getMachines(programNumbers: number[]) {
  machines.value = await $fetch('/api/machines', {
    query: { programNo: programNumbers },
  })
  selectedMachines.value = Array(20).fill(machines.value[0])
}
async function getDefaultBatchNo() {
  jobOrderParams.value.jobNo = await $fetch('/api/job-orders/batch-no')
}
async function getAdditonalData() {
  customers.value = await $fetch('/api/customers')
  fabricTypes.value = await $fetch('/api/fabric-types')
}
async function getRecipeSteps() {
  if (props.variant) {
    selectedRecipe.value = await $fetch(`/api/recipes/variant/${recipeHeader.value?.recipeId}/${encodeURIComponent(props.variant.variantName)}`, { query: { machineId: props.machineId } })
  } else {
    selectedRecipe.value = await $fetch(`/api/recipes/master/steps/${recipeHeader.value?.recipeId}`, { query: { machineId: recipeHeader.value?.machineId } })
  }

  // Extract all unique program numbers from selectedRecipe
  const programNumbers = [...new Set(selectedRecipe.value.map(program => program.programNo))]
  await getMachines(programNumbers)

  selectedMachines.value = Array(20).fill(machines.value.find(m => m.machineId === Number(selectedRecipe.value[0].machineId)))
  selectedRecipe.value.forEach((program) => {
    program.flotteRatio = 1
    program.totalWeight = 20
    program.flotte = computed(() => program.flotteRatio * program.totalWeight)
  })
  // fetchParameters()
  setProgramDefaultTabs()
}
async function fetchParameters() {
  const machineId = stateStore.defaultMachine
  for (const prog of selectedRecipe.value) {
    const params = await $fetch<CommandParameter[]>(
      `/api/programs/parameters/${machineId}`,
      { params: { programNo: prog.programNo } },
    )
    params.forEach(p => p.selectedValue = p.optimizedValue ?? p.minValue)
    parameters.value[prog.programNo] = params
  }
}
function updateParameterValue(
  programNo: number,
  paramId: number,
  value: number,
) {
  const list = parameters.value[programNo]
  const param = list?.find(p => p.paramId === paramId)
  if (param) {
    param.selectedValue = value
  }
}
function resetParameter(programNo: number, paramId: number) {
  const arr = parameters.value[programNo]
  const p = arr?.find(x => x.paramId === paramId)
  if (p)
    p.selectedValue = p.optimizedValue ?? p.minValue
}
function getParameterTable(programNo: number) {
  const params = (parameters.value[programNo] || []).slice()
    .sort((a, b) =>
      a.mainStep - b.mainStep
      || a.commandName.localeCompare(b.commandName)
      || a.paramName.localeCompare(b.paramName),
    )

  const stepCounts: Record<number, number> = {}
  const cmdCounts: Record<string, number> = {}

  params.forEach((p) => {
    stepCounts[p.mainStep] = (stepCounts[p.mainStep] || 0) + 1
    const key = `${p.mainStep}|${p.commandName}`
    cmdCounts[key] = (cmdCounts[key] || 0) + 1
  })

  const seenSteps = new Set<number>()
  const seenCmds = new Set<string>()

  return params.map((p) => {
    const cmdKey = `${p.mainStep}|${p.commandName}`
    const showStep = !seenSteps.has(p.mainStep)
    const showCommand = !seenCmds.has(cmdKey)
    if (showStep)
      seenSteps.add(p.mainStep)
    if (showCommand)
      seenCmds.add(cmdKey)
    return {
      ...p,
      showStep,
      showCommand,
      stepRowspan: stepCounts[p.mainStep],
      commandRowspan: cmdCounts[cmdKey],
    }
  })
}

function getRecipeLabel(header: RecipeProgramMaster) {
  return `${header.recipeId} - ${header.recipeName} (${header.machineId})`
}
function getAllMaterialsFromSteps(program: RecipeMasterStep) {
  const materials = program.steps.flatMap(step =>
    step.materials.map(material => ({
      ...material,
      calculated: computed(() => calculateAmount(material, program)),
    })),
  )
  return materials.sort((a, b) => a.orderNo - b.orderNo)
}

function updateRecipe(val: RecipeProgramMaster | undefined) {
  recipeHeader.value = { ...val, ...(props.variant || {}) }
  getRecipeSteps()
}
function updateAmount(programIndex: number, row: RecipeMasterMaterial) {
  const step = selectedRecipe.value[programIndex].steps.find(step => step.stepNo === row.programIndex && step.type === row.type)
  const material = step!.materials.find(material => material.materialCode === row.materialCode && material.orderNo === row.orderNo)
  material!.amount = row.amount
}
function calculateAmount(row: any, program: any) {
  const weightSource = programWeightsEnabled.value ? program.totalWeight : jobOrderParams.value.totalWeight
  const flotteSource = programWeightsEnabled.value ? program.flotte : flotte.value

  if (row.unit === 0) {
    return `${row.amount * weightSource * 10} g`
  } else if (row.unit === 1) {
    return `${row.amount * flotteSource} g`
  } else if (row.unit === 2) {
    return `${row.amount * flotteSource} cc`
  } else {
    return `${row.amount} ${t(`units.${row.unit}`)}`
  }
}

function calculateAmountVal(row: any, program: any) {
  const weightSource = programWeightsEnabled.value ? program.totalWeight : jobOrderParams.value.totalWeight
  const flotteSource = programWeightsEnabled.value ? program.flotte : flotte.value

  if (row.unit === 0) {
    return row.amount * weightSource * 10
  } else if (row.unit === 1) {
    return row.amount * flotteSource
  } else if (row.unit === 2) {
    return row.amount * flotteSource
  } else {
    return row.amount
  }
}
function onParameterChange(type: string, newVal: number) {
  if (type === 'weight') {
    selectedRecipe.value.forEach((program) => {
      program.totalWeight = newVal
    })
  } else if (type === 'flotteRatio') {
    selectedRecipe.value.forEach((program) => {
      program.flotteRatio = newVal
    })
  }
}

async function addNewCustomer() {
  if (!newCustomerName.value.trim()) {
    notifyFail(t('CustomerNameRequired'))
    return
  }

  try {
    stateStore.isLoading = true
    const nextId = customers.value.length > 0
      ? Math.max(...customers.value.map(c => c.customerId)) + 1
      : 1

    const newCustomer: Customer = {
      customerId: nextId,
      customerNo: nextId,
      customerName: newCustomerName.value.trim(),
      customerNotes: '',
    }

    await $fetch('/api/customers', {
      method: 'POST',
      body: { customer: newCustomer },
    })

    customers.value.push(newCustomer)
    jobOrderParams.value.customerName = newCustomer.customerName

    newCustomerName.value = ''
    showAddCustomerDialog.value = false
    stateStore.isLoading = false
  } catch (error) {
    stateStore.isLoading = false
    notifyFail(t('Failed'))
  }
}

async function addNewFabric() {
  if (!newFabricName.value.trim()) {
    notifyFail(t('FabricNameRequired'))
    return
  }

  try {
    stateStore.isLoading = true
    const nextId = fabricTypes.value.length > 0
      ? Math.max(...fabricTypes.value.map(f => f.fabricTypeId)) + 1
      : 1

    const newFabric: FabricType = {
      fabricTypeId: nextId,
      fabricTypeName: newFabricName.value.trim(),
      fabricTypeNotes: '',
    }

    await $fetch('/api/fabric-types', {
      method: 'POST',
      body: { fabricType: newFabric },
    })

    fabricTypes.value.push(newFabric)
    jobOrderParams.value.fabricType = newFabric.fabricTypeName

    newFabricName.value = ''
    showAddFabricDialog.value = false
    stateStore.isLoading = false
  } catch (error) {
    stateStore.isLoading = false
    notifyFail(t('Failed'))
  }
}

async function onSave() {
  const optimizationParams = Object
    .values(parameters.value)
    .flat()
    .filter(p => p.isOptimized)
    .map(p => ({
      machineId: p.machineId,
      programNo: p.programNo,
      paramId: p.paramId,
      paramIndex: p.paramIndex,
      selectedValue: p.selectedValue,
    }))
  selectedRecipe.value.forEach((program) => {
    program.steps.forEach((step) => {
      step.materials.forEach((material) => {
        material.calculated = calculateAmountVal(material, program)
      })
    })
  })

  // Check capacity for each selected machine
  const capacityWarnings: string[] = []
  const numberOfJobs = createMultiple.value ? jobOrderParams.value.numberOfJobs : 1
  const thresholdPercentage = CAPACITY_THRESHOLD * 100

  for (let i = 0; i < numberOfJobs; i++) {
    const machine = selectedMachines.value[i]
    if (machine && machine.capacity && machine.capacity > 0) {
      const capacityLimit = machine.capacity * CAPACITY_THRESHOLD
      if (jobOrderParams.value.totalWeight > capacityLimit) {
        capacityWarnings.push(
          `${machine.machineName}: ${jobOrderParams.value.totalWeight}kg > ${capacityLimit.toFixed(2)}kg (${thresholdPercentage}% ${t('jobOrderParams.Of')} ${machine.capacity}kg)`,
        )
      }
    }
  }

  // If there are capacity warnings, show confirmation dialog
  if (capacityWarnings.length > 0) {
    const proceedWithCapacityWarning = await new Promise<boolean>((resolve) => {
      q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          bodyText: `${t('confirmationDialogBody.CapacityExceeded', { percentage: thresholdPercentage })}\n\n${capacityWarnings.join('\n')}\n\n${t('confirmationDialogBody.ContinueAnyway')}`,
          confirmBtn: {
            label: t('Confirm'),
            color: 'positive',
            icon: 'done',
          },
          cancelBtn: {
            label: t('Cancel'),
            icon: 'close',
          },
        },
      }).onOk(() => {
        resolve(true)
      }).onCancel(() => {
        resolve(false)
      })
    })

    if (!proceedWithCapacityWarning) {
      return
    }
  }

  try {
    // TODO: Check for multiple jobs if enabled
    const status: number = await $fetch(`/api/dyelots/status/${jobOrderParams.value.jobNo}`)
    if (status === 30 || status === 40) {
      if (!stateStore.jobOrderPrefs.allowOverrideStartedJobOrders) {
        notifyFail(t('JobOrderStarted'))
        return
      }

      const proceedWithOverride = await new Promise<boolean>((resolve) => {
        q.dialog({
          component: ConfirmationDialog,
          componentProps: {
            bodyText: t('confirmationDialogBody.OverrideStartedJobOrder'),
            confirmBtn: {
              label: t('Confirm'),
              color: 'positive',
              icon: 'done',
            },
            cancelBtn: {
              label: t('Cancel'),
              icon: 'close',
            },
          },
        }).onOk(() => {
          resolve(true)
        }).onCancel(() => {
          resolve(false)
        })
      })

      if (!proceedWithOverride) {
        return
      }
    } else if (status > 0) {
      q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          bodyText: t('confirmationDialogBody.JobOrderExists'),
          confirmBtn: {
            label: t('Confirm'),
            color: 'positive',
            icon: 'done',
          },
          cancelBtn: {
            label: t('Cancel'),
            icon: 'close',
          },
        },
      }).onOk(async () => {
        stateStore.isLoading = true
        await $fetch(`/api/dyelots/${jobOrderParams.value.jobNo}`, { method: 'DELETE' })
        await $fetch(`/api/job-orders/create/batch`, {
          method: 'POST',
          body: {
            recipe: selectedRecipe.value,
            recipeHeader: recipeHeader.value,
            machines: selectedMachines.value.slice(0, jobOrderParams.value.numberOfJobs).map(machine => machine.machineId),
            params: { ...jobOrderParams.value, flotte: flotte.value },
            optimizationParams,
          },
        })

        await $fetch('/api/job-orders/batch-no', {
          method: 'POST',
          body: { batchNo: jobOrderParams.value.jobNo },
        })

        dataStore.newJobOrders = true
        stateStore.isLoading = false
        onDialogOK({
          print: printWhenDone.value,
          materials: printWhenDone.value ? selectedRecipe.value : undefined,
          machines: selectedMachines.value.slice(0, jobOrderParams.value.numberOfJobs),
          params: printWhenDone.value ? { ...jobOrderParams.value, flotte: flotte.value } : undefined,
          recipeParams: printWhenDone.value ? recipeHeader.value : undefined,
        })
      })
      return
    }

    stateStore.isLoading = true
    await $fetch(`/api/job-orders/create/batch`, {
      method: 'POST',
      body: {
        recipe: selectedRecipe.value,
        recipeHeader: recipeHeader.value,
        machines: selectedMachines.value.slice(0, jobOrderParams.value.numberOfJobs).map(machine => machine.machineId),
        params: { ...jobOrderParams.value, flotte: flotte.value },
        optimizationParams,
      },
    })

    await $fetch('/api/job-orders/batch-no', {
      method: 'POST',
      body: { batchNo: jobOrderParams.value.jobNo },
    })

    dataStore.newJobOrders = true
    onDialogOK({
      print: printWhenDone.value,
      materials: printWhenDone.value ? selectedRecipe.value : undefined,
      machines: selectedMachines.value.slice(0, jobOrderParams.value.numberOfJobs),
      params: printWhenDone.value ? { ...jobOrderParams.value, flotte: flotte.value } : undefined,
      recipeParams: printWhenDone.value ? recipeHeader.value : undefined,
    })
  } catch (error: any) {
    let errorMessage

    if (typeof error === 'string' || (error && error.toString)) {
      const errorString = typeof error === 'string' ? error : error.toString()
      const connectionMatch = errorString.match(/Failed to connect to [^ ]+ in/)
      if (connectionMatch) {
        errorMessage = connectionMatch[0].replace(' in', '')
      } else {
        errorMessage = t('Failed')
      }
    } else {
      errorMessage = t('Failed')
    }
    notifyFail(errorMessage)
    return
  } finally {
    stateStore.isLoading = false
  }
}
async function onCancel() {
  if (selectedRecipe.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.JobOrderCancel'),
        confirmBtn: {
          label: t('Confirm'),
          color: 'positive',
          icon: 'done',
        },
        cancelBtn: {
          label: t('Cancel'),
          icon: 'close',
        },
      },
    }).onOk(() => {
      onDialogCancel()
    })
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    full-height
    @hide="onDialogHide"
  >
    <QCard>
      <div class="text-center pt-5 text-xl">
        <h2>{{ t('NewBatchJobOrder') }}</h2>
      </div>
      <div class="flex flex-row flex-wrap justify-center">
        <div
          v-if="!variant"
          class="row-item"
          style="position: relative;"
        >
          <span class="item-label">{{ t('Recipe') }}</span>
          <QInput
            v-model="recipeFilter"
            borderless
            dense
            filled
            :placeholder="t('Recipe')"
            @update:model-value="onRecipeInputChange"
            @focus="onRecipeFocus"
          >
            <template #append>
              <QIcon name="search" />
            </template>
          </QInput>
          <QMenu
            v-model="showRecipeOptions"
            no-parent-event
            max-height="300px"
            fit
          >
            <QList dense>
              <QItem
                v-for="recipe in filteredRecipes"
                :key="`${recipe.recipeId}-${recipe.machineId}`"
                clickable
                @click="selectRecipe(recipe)"
              >
                <QItemSection>
                  <QItemLabel>{{ getRecipeLabel(recipe) }}</QItemLabel>
                </QItemSection>
              </QItem>
              <QItem v-if="filteredRecipes.length === 0">
                <QItemSection>
                  <QItemLabel class="text-grey">
                    {{ t('NoResults') }}
                  </QItemLabel>
                </QItemSection>
              </QItem>
            </QList>
          </QMenu>
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('Customer') }}</span>
          <div class="flex-row" style="display: flex;">
            <QSelect
              v-model="jobOrderParams.customerName"
              borderless
              dense
              filled
              emit-value
              map-options
              option-label="customerName"
              option-value="customerName"
              :options="customers"
              class="flex-grow-1"
            />
            <QBtn
              dense
              flat
              icon="add"
              color="primary"
              size="sm"
              @click="showAddCustomerDialog = true"
            />
          </div>
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('FabricType') }}</span>
          <div class="flex-row" style="display: flex;">
            <QSelect
              v-model="jobOrderParams.fabricType"
              borderless
              dense
              filled
              emit-value
              map-options
              option-label="fabricTypeName"
              option-value="fabricTypeName"
              :options="fabricTypes"
              class="flex-grow-1"
            />
            <QBtn
              dense
              flat
              icon="add"
              color="primary"
              size="sm"
              @click="showAddFabricDialog = true"
            />
          </div>
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.ID') }}</span>
          <div class="flex-row" style="display: flex; align-items: flex-start;">
            <QInput
              v-model="jobOrderParams.jobNo"
              borderless
              dense
              type="text"
              filled
              :rules="[val => /^[a-zA-Z0-9_]+$/.test(val) || t('jobOrderParams.BatchNoValidation')]"
              class="flex-grow-1"
            />
            <QBtn
              dense
              flat
              icon="autorenew"
              color="primary"
              size="sm"
              style="height: 40px;"
              @click="getDefaultBatchNo"
            />
          </div>
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.TotalWeight') }}</span>
          <QInput
            v-model.number="jobOrderParams.totalWeight"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
            :disable="programWeightsEnabled"
            @update:model-value="(value) => onParameterChange('weight', value)"
          />
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.FlotteRatio') }}</span>
          <QInput
            v-model.number="jobOrderParams.flotteRatio"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
            :disable="programWeightsEnabled"
            @update:model-value="(value) => onParameterChange('flotteRatio', value)"
          />
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.Flotte') }}</span>
          <QInput
            v-model="flotte"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
            disable
          />
        </div>
        <div class="row-item flex-center">
          <QCheckbox
            v-model="createMultiple"
            dense
            filled
            disable
            :label="t('jobOrderParams.IsMultiple')"
            mb-2
          />
          <QInput
            v-model.number="jobOrderParams.numberOfJobs"
            class="item-input"
            dense
            type="number"
            min="1"
            max="20"
            :label="t('jobOrderParams.NoOfJobs')"
            :disable="!createMultiple"
            :rules="[(val: number) => val >= 1 && val <= 20]"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.PartyNo') }}</span>
          <QInput
            v-model="jobOrderParams.partyNo"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div v-if="stateStore.jobOrderPrefs.show?.yarn" class="row-item">
          <span class="item-label">{{ t('jobOrderParams.Yarn') }}</span>
          <QInput
            v-model="jobOrderParams.yarn"
            class="item-input"
            dense
            type="text"
            filled
          />
        </div>
        <div v-if="stateStore.jobOrderPrefs.show?.ASNo" class="row-item">
          <span class="item-label">{{ t('jobOrderParams.ASNo') }}</span>
          <QInput
            v-model="jobOrderParams.ASNo"
            class="item-input"
            dense
            type="text"
            filled
          />
        </div>
        <div v-if="stateStore.jobOrderPrefs.show?.orderNo" class="row-item">
          <span class="item-label">{{ t('jobOrderParams.OrderNo') }}</span>
          <QInput
            v-model="jobOrderParams.orderNo"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">{{ t('jobOrderParams.Notes') }}</span>
          <QInput
            v-model="jobOrderParams.notes"
            class="item-input"
            dense
            type="textarea"
            filled
          />
        </div>
        <div class="row-item flex-center">
          <QCheckbox
            v-model="programWeightsEnabled"
            dense
            :label="t('jobOrderParams.ProgramFlotteEnabled')"
          />
          <QCheckbox
            v-model="printWhenDone"
            dense
            :label="t('jobOrderParams.PrintWhenDone')"
          />
        </div>
      </div>
      <div flex-basis-full>
        <h4 flex-center>
          {{ `${t('Machine')} / ${t('Machines')}` }}
        </h4>
        <div class="machine-selection-container">
          <div
            v-for="i in Math.min(20, createMultiple ? jobOrderParams.numberOfJobs : 1)"
            :key="i"
            class="machine-item"
          >
            <span font-900>{{ i }}.</span>
            <QSelect
              v-model="selectedMachines[i - 1]"
              borderless
              dense
              filled
              options-dense
              option-label="machineName"
              :options="machines"
              class="machine-select"
            />
          </div>
        </div>
      </div>
      <div class="row items-start q-gutter-md m-10">
        <div class="col-12">
          <div
            v-for="(program, programIndex) in selectedRecipe"
            :key="program.programNo"
            class="row mb-2"
          >
            <div class="col">
              <h3 class="q-mb-sm flex-center">
                {{ program.programName }}
              </h3>

              <div class="q-mb-md flex-center items-center">
                <QBtnToggle
                  v-model="activeTabs[program.programNo]"
                  class="toggle-border"
                  :options="[
                    { label: t('Materials'), value: 'materials' },
                    { label: t('Commands'), value: 'commands' },
                  ]"
                  rounded
                  no-caps
                  unelevated
                  size="md"
                />
              </div>

              <div v-show="activeTabs[program.programNo] === 'materials'">
                <div v-show="programWeightsEnabled" class="row flex-center justify-evenly mb-2">
                  <div class="row">
                    <div class="mr-2">
                      <span class="item-label">{{ t('jobOrderParams.TotalWeight') }}</span>
                      <QInput
                        v-model="program.totalWeight"
                        class="item-input"
                        dense
                        type="number"
                        min="0"
                        filled
                      />
                    </div>
                    <div class="mr-2">
                      <span class="item-label">{{ t('jobOrderParams.FlotteRatio') }}</span>
                      <QInput
                        v-model="program.flotteRatio"
                        class="item-input"
                        dense
                        type="number"
                        min="0"
                        filled
                      />
                    </div>
                    <div>
                      <span class="item-label">{{ t('jobOrderParams.Flotte') }}</span>
                      <QInput
                        v-model="program.flotte"
                        class="item-input"
                        dense
                        type="number"
                        min="0"
                        filled
                        disable
                      />
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <QTable
                      :rows="getAllMaterialsFromSteps(program)"
                      :rows-per-page-options="[0]"
                      hide-bottom
                      :columns
                    >
                      <template #body="props">
                        <QTr>
                          <QTd
                            v-for="col in props.cols"
                            :key="col.name"
                            :props="props"
                            :style="cellStyle(col, props.row, props.row.orderNo, false, q.dark.isActive, colorStore.colors)"
                          >
                            <span v-if="col.field === 'unit'">{{ t(`units.${props.row.unit}`) }}</span>
                            <span v-else-if="col.field === 'type'">{{ t(`materialTypes.${props.row.type + 1}`) }}</span>
                            <span v-else-if="col.field === 'isManual'">{{ props.row.isManual ? t('Man') : t('Auto') }}</span>
                            <span v-else-if="col.field === 'amount'">
                              <QInput
                                v-model.number="props.row.amount"
                                type="number"
                                min="0"
                                dense
                                borderless
                                input-style="color: black;"
                                @update:model-value="updateAmount(programIndex, props.row)"
                              />
                            </span>
                            <span v-else>{{ props.row[col.field] }}</span>
                          </QTd>
                        </QTr>
                      </template>
                    </QTable>
                  </div>
                </div>
              </div>
              <div v-show="activeTabs[program.programNo] === 'commands'">
                <div class="row">
                  <div class="col-12">
                    <table class="parameter-table">
                      <thead>
                        <tr>
                          <th>{{ t('StepNo') }}</th>
                          <th>{{ t('batchPlanParameterFields.CommandName') }}</th>
                          <th>{{ t('batchPlanParameterFields.ParamName') }}</th>
                          <th>{{ t('batchPlanParameterFields.Value') }}</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="row in getParameterTable(program.programNo)"
                          :key="row.paramId"
                        >
                          <td v-if="row.showStep" :rowspan="row.stepRowspan">
                            {{ row.mainStep }}
                          </td>
                          <td v-if="row.showCommand" :rowspan="row.commandRowspan">
                            {{ row.commandName }}
                          </td>
                          <td>{{ row.paramName }}</td>
                          <td>
                            <QInput
                              v-model="row.selectedValue"
                              type="number"
                              :placeholder="`${row.minValue} - ${row.maxValue}`"
                              :rules="[
                                (val: number) =>
                                  (val >= row.minValue && val <= row.maxValue)
                                  || `${t('warnings.MustBeBetween')} ${row.minValue} - ${row.maxValue}`,
                              ]"
                              dense
                              filled
                              @update:model-value="val => updateParameterValue(program.programNo, row.paramId, Number(val))"
                            />
                          </td>
                          <td>
                            <QBtn
                              dense
                              flat
                              icon="restore"
                              @click="resetParameter(program.programNo, row.paramId)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="recipeHeader" class="dialog-button-section">
        <QBtn
          :label="t('Save')"
          type="submit"
          color="primary"
          icon="save"
          @click="onSave"
        />
        <QBtn
          :label="t('Cancel')"
          color="warning"
          icon="cancel"
          @click="onCancel"
        />
      </div>
    </QCard>
    <QDialog v-model="showAddCustomerDialog" position="top">
      <QCard class="q-pa-md" style="min-width: 350px">
        <QCardSection>
          <div class="text-h6">
            {{ t('AddNewCustomer') }}
          </div>
        </QCardSection>
        <QCardSection>
          <QInput
            v-model="newCustomerName"
            :label="t('customerFields.Name')"
            autofocus
            dense
            filled
            :rules="[val => !!val || t('Required')]"
          />
        </QCardSection>
        <QCardActions align="right">
          <QBtn
            v-close-popup
            flat
            :label="t('Cancel')"
            color="primary"
          />
          <QBtn
            :label="t('Add')"
            color="primary"
            @click="addNewCustomer"
          />
        </QCardActions>
      </QCard>
    </QDialog>
    <QDialog v-model="showAddFabricDialog" position="top">
      <QCard class="q-pa-md" style="min-width: 350px">
        <QCardSection>
          <div class="text-h6">
            {{ t('AddNewFabric') }}
          </div>
        </QCardSection>
        <QCardSection>
          <QInput
            v-model="newFabricName"
            :label="t('fabricTypeFields.Name')"
            autofocus
            dense
            filled
            :rules="[val => !!val || t('Required')]"
          />
        </QCardSection>
        <QCardActions align="right">
          <QBtn
            v-close-popup
            flat
            :label="t('Cancel')"
            color="primary"
          />
          <QBtn
            :label="t('Add')"
            color="primary"
            @click="addNewFabric"
          />
        </QCardActions>
      </QCard>
    </QDialog>
  </QDialog>
</template>

<style scoped>
.machine-selection-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.machine-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.machine-select {
  min-width: 150px;
  flex-grow: 1;
}
.row.program-row {
  display: flex;
  width: 100%;
}
.row.program-row > .col-12,
.row.program-row > .col-4 {
  display: flex;
  flex-direction: column;
}
.dialog-button-section {
  display: flex;
  justify-content: flex;
  gap: 12px;
  padding: 16px;
}
.parameter-table {
  width: 100% !important;
  border-collapse: collapse !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.parameter-table th,
.parameter-table td {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  padding: 6px 8px !important;
  text-align: center;
  vertical-align: middle;
}

.theme--light .parameter-table th,
.theme--light .parameter-table td {
  border-color: rgba(0, 0, 0, 0.12) !important;
}

.theme--dark .parameter-table th,
.theme--dark .parameter-table td {
  border-color: rgba(255, 255, 255, 0.12) !important;
}
.toggle-border {
  border: 1px solid var(--q-primary);
}
</style>
