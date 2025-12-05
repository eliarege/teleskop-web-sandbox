<script setup lang="ts">
import { RecipeType } from '~/shared/constants'
import type { JobOrderParams, Machine, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

const props = defineProps({
  batchNo: {
    type: String,
    required: false,
  },
  steps: {
    type: Object as PropType<RecipeMasterStep[]>,
    required: false,
  },
  recipeParams: {
    type: Object as PropType<RecipeProgramMaster>,
    required: false,
  },
  params: {
    type: Object as PropType<JobOrderParams>,
    required: false,
  },
  machines: {
    type: Object as PropType<Machine[]>,
    required: false,
  },
})
const { t } = useI18n()
const companyInfo = ref(null)
const currentUser = ref('Default User')
const currentTime = ref(new Date().toLocaleString())

// Reactive state for fetched data
const fetchedSteps = ref<RecipeMasterStep[]>([])
const fetchedRecipeParams = ref<RecipeProgramMaster | null>(null)
const fetchedParams = ref<JobOrderParams | null>(null)
const fetchedMachines = ref<Machine[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed properties that use either props or fetched data
const actualSteps = computed(() => props.steps || fetchedSteps.value)
const actualRecipeParams = computed(() => props.recipeParams || fetchedRecipeParams.value)
const actualParams = computed(() => props.params || fetchedParams.value)
const actualMachines = computed(() => props.machines || fetchedMachines.value)

const jobNumbers = computed(() => {
  if (!actualParams.value)
    return ''

  const result = []
  const baseJobNo = actualParams.value.jobNo
  const numberOfJobs = actualParams.value.numberOfJobs || 1

  for (let i = 0; i < numberOfJobs; i++) {
    result.push(Number(baseJobNo) + i)
  }
  return result.join(', ')
})

const hasManyJobs = computed(() => {
  if (!actualParams.value)
    return false
  return (actualParams.value.numberOfJobs || 1) > 3
})

const barcodeUrl = computed(() => {
  if (!actualParams.value)
    return ''

  if (hasManyJobs.value) {
    const baseJobNo = actualParams.value.jobNo
    const lastJobNo = Number(baseJobNo) + Number(actualParams.value.numberOfJobs) - 1
    return `https://barcode.tec-it.com/barcode.ashx?data=${baseJobNo}-${lastJobNo}&code=Code128&translate-esc=false`
  }
  return `https://barcode.tec-it.com/barcode.ashx?data=${jobNumbers.value}&code=Code128&translate-esc=false`
})

// Fetch data if batchNo is provided but other props are not
onMounted(async () => {
  if (props.batchNo && !props.steps && !props.recipeParams && !props.params && !props.machines) {
    await fetchJobOrderData()
  }
})

async function fetchJobOrderData() {
  if (!props.batchNo)
    return

  isLoading.value = true
  error.value = null

  try {
    const data = await $fetch(`/api/job-orders/${props.batchNo}`)
    fetchedSteps.value = data.steps
    fetchedRecipeParams.value = data.recipeParams
    fetchedParams.value = data.params
    fetchedMachines.value = data.machines
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch job order data'
    console.error('Failed to fetch job order:', err)
  } finally {
    isLoading.value = false
  }
}

fetchCompanyInfo()
function getAllMaterialsFromSteps(program: RecipeMasterStep) {
  // Get regular step materials
  const regularMaterials = program.steps.flatMap(step =>
    step.materials.map(material => ({
      ...material,
      calculated: computed(() => calculateAmount(material, program)),
      isIntermediateStep: false,
    })),
  )

  // Get manual step materials (intermediate steps)
  const manualMaterials = (program.manualSteps || []).flatMap(manualStep =>
    manualStep.materials.map(material => ({
      ...material,
      calculated: computed(() => calculateAmount(material, program)),
      isIntermediateStep: true,
      displayOrderNo: manualStep.nextStep, // For sorting: place before the nextStep
    })),
  )

  // Combine and sort: regular materials by orderNo, manual materials placed before their nextStep
  const allMaterials = [...regularMaterials, ...manualMaterials]
  return allMaterials.sort((a, b) => {
    const aOrder = a.isIntermediateStep ? a.displayOrderNo - 0.5 : a.orderNo
    const bOrder = b.isIntermediateStep ? b.displayOrderNo - 0.5 : b.orderNo
    return aOrder - bOrder
  })
}
function calculateAmount(row: any, program: any) {
  if (!actualParams.value)
    return '0'

  if (row.type === RecipeType.DYE) {
    if (row.unit === 0) {
      return `${row.amount * program.totalWeight * 10} g`
    } else if (row.unit === 1) {
      return `${row.amount * program.flotte} g`
    } else if (row.unit === 2) {
      return `${row.amount * program.flotte} cc`
    } else {
      return `${row.amount} ${t(`units.${row.unit}`)}`
    }
  } else {
    if (row.unit === 0) {
      return `${row.amount * actualParams.value.totalWeight * 10} g`
    } else if (row.unit === 1) {
      return `${row.amount * actualParams.value.flotte} g`
    } else if (row.unit === 2) {
      return `${row.amount * actualParams.value.flotte} cc`
    } else {
      return `${row.amount} ${t(`units.${row.unit}`)}`
    }
  }
}

async function fetchCompanyInfo() {
  try {
    companyInfo.value = await $fetch('/api/company/info')
  } catch (error) {
    console.error('Failed to fetch company logo:', error)
  }
}
const columns = [
  { name: 'orderNo', label: t('recipeFields.OrderNo'), align: 'center', field: 'orderNo' },
  { name: 'isManual', label: t('recipeFields.AutoMan'), align: 'center', field: 'isManual' },
  { name: 'materialCode', label: t('materialFields.Code'), align: 'center', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'center', field: 'materialName', style: 'max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'amount', label: t('weighingFields.RecipeAmount'), align: 'center', field: 'amount' },
  { name: 'unit', label: t('Unit'), align: 'center', field: 'unit' },
  { name: 'calculated', label: t('jobOrderParams.Calculated'), align: 'center', field: 'calculated' },
]

function printPage() {
  window.print()
}
</script>

<template>
  <div class="printable-page">
    <div v-if="isLoading" class="text-center p-4">
      {{ t('Loading...') }}
    </div>
    <div v-else-if="error" class="text-center p-4 text-red-500">
      {{ error }}
    </div>
    <template v-else-if="actualParams && actualRecipeParams">
      <div class="print-button-container">
        <QBtn icon="print" @click="printPage">
          {{ t('Print') }}
        </QBtn>
      </div>

      <header>
        <div class="logo-and-title">
          <div class="company-logo">
            <img
              v-if="companyInfo"
              :src="(companyInfo as any).logoPath"
              alt="Company Logo"
              class="logo-img"
              h-20
              w-20
            >
          </div>
          <div v-if="companyInfo">
            <strong>{{ (companyInfo as any).name }}</strong>
          </div>
          <h1>{{ t('BatchRecipeSystem') }}</h1>
        </div>
      </header>

      <section class="job-info" :class="{ 'with-barcode-row': hasManyJobs }">
        <div class="info-grid" :class="{ 'full-width': hasManyJobs }">
          <div class="info-item">
            <span>{{ t('jobOrderParams.ID') }} / {{ t('jobOrderParams.IDs') }}: </span>
            <strong>{{ jobNumbers }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('recipeFields.ID') }} ({{ t('RecipeVariant') }}): </span>
            <strong>{{ actualRecipeParams.recipeId }} {{ actualRecipeParams.variantName ? `(${actualRecipeParams.variantName})` : '' }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.TotalWeight') }}: </span>
            <strong>{{ actualParams.totalWeight }} kg</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.Flotte') }}: </span>
            <strong>{{ actualParams.flotte }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('Machine') }} / {{ t('Machines') }}:</span>
            <strong v-for="(machine, idx) in actualMachines" :key="idx">  {{ idx + 1 }}. {{ t('JobOrder') }}: {{ machine.machineId }}.{{ machine.machineName }}, </strong>
          </div>
          <div class="info-item">
            <span>{{ `${t('jobOrderParams.ColorCode')} / ${t('jobOrderParams.ColorName')}` }}:</span>
            <strong :style="`color: ${colorCodeToRGB(actualRecipeParams.colorCode)}` ">{{ actualRecipeParams.colorCode }} / {{ actualRecipeParams.colorName }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('Customer') }}:</span>
            <strong>{{ actualParams.customerName }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('FabricType') }}:</span>
            <strong>{{ actualParams.fabricType }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.OrderNo') }}:</span>
            <strong>{{ actualParams.orderNo }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.PartyNo') }}:</span>
            <strong>{{ actualParams.partyNo }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.Yarn') }}:</span>
            <strong>{{ actualParams.yarn }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.ASNo') }}:</span>
            <strong>{{ actualParams.ASNo }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.PreparedBy') }}: </span>
            <strong>{{ currentUser }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.PreparationDate') }}: </span>
            <strong>{{ currentTime }}</strong>
          </div>
          <div class="info-item">
            <span>{{ t('Programs') }}:</span>
            <strong v-for="(program, idx) in actualSteps" :key="idx">{{ program.programNo }}, </strong>
          </div>
          <div class="info-item">
            <span>{{ t('jobOrderParams.Notes') }}: </span>
            <p>{{ actualParams.notes }}</p>
          </div>
        </div>

        <div v-if="!hasManyJobs" class="barcode">
          <img :src="barcodeUrl" alt="Barcode">
        </div>
      </section>

      <section v-if="hasManyJobs" class="barcode-row">
        <div class="barcode-container">
          <div class="barcode-label">
            {{ t('jobOrderParams.IDRange') }}: {{ actualParams.jobNo }} - {{ Number(actualParams.jobNo) + Number(actualParams.numberOfJobs) - 1 }}
          </div>
          <img :src="barcodeUrl" alt="Barcode">
        </div>
      </section>

      <section class="recipe">
        <div class="col-8">
          <div
            v-for="(program, programIndex) in actualSteps"
            :key="program.programNo"
            border-gray
            border-2
            class="row"
          >
            <div class="col">
              <div class="row flex-center justify-evenly">
                <h3 flex-center>
                  {{ program.programName }}
                </h3>
                <div class="row">
                  <div mr-2>
                    <span class="item-label">{{ t('jobOrderParams.FlotteRatio') }}: </span>
                    <strong> {{ program.flotteRatio }}</strong>
                  </div>
                  <div mr-2>
                    <span class="item-label">{{ t('jobOrderParams.DyeWeight') }}: </span>
                    <strong> {{ program.totalWeight }}</strong>
                  </div>
                  <div>
                    <span class="item-label">{{ t('jobOrderParams.Flotte') }}: </span>
                    <strong> {{ program.flotte }}</strong>
                  </div>
                </div>
              </div>
              <QTable
                :rows="getAllMaterialsFromSteps(program)"
                :rows-per-page-options="[0]"
                dense
                hide-bottom
                flat
                :columns
                mb-5
              >
                <template #body="props">
                  <QTr :class="{ 'font-bold': props.row.type === 1, 'intermediate-step-row': props.row.isIntermediateStep }">
                    <QTd
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                      :style="props.row.isIntermediateStep ? 'background-color: #fef3c7; color: #78350f;' : ''"
                    >
                      <span v-if="col.field === 'unit'">
                        {{ t(`units.${props.row.unit}`) }}
                      </span>
                      <span v-else-if="col.field === 'isManual'">
                        {{ props.row.isIntermediateStep ? t('Man') : (props.row.isManual ? t('Man') : t('Auto')) }}
                      </span>
                      <span v-else-if="col.field === 'orderNo'">
                        {{ props.row.isIntermediateStep ? t('Man') : props.row.orderNo }}
                      </span>
                      <span v-else>
                        {{ props.row[col.field] }}
                      </span>
                    </QTd>
                  </QTr>
                </template>
              </QTable>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.printable-page {
  background: white;
  color: black;
  padding: 20px;
  font-family: Arial, sans-serif;
  width: 210mm;
  height: 297mm;
}

header {
  text-align: center;
  margin-bottom: 20px;
}
.company-logo img {
  height: 50px;
  width: auto;
}
.company-logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.job-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.job-info.with-barcode-row {
  flex-direction: column;
}

.info-grid {
  width: 70%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-grid.full-width {
  width: 100%;
}

.info-item {
  padding: 5px;
  border: 1px solid #ddd;
}

.notes p {
  margin: 0;
  font-style: italic;
}

.barcode {
  text-align: center;
}

.barcode-row {
  margin: 15px 0;
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;
}

.barcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.barcode-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.recipe {
  margin-top: 20px;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid black;
  text-align: center;
  padding: 8px;
}

.print-button-container {
  text-align: right;
  margin-bottom: 10px;
}

.print-button-container button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
}

.print-button-container button:hover {
  background: #0056b3;
}

.font-bold {
  font-weight: bold;
}

.intermediate-step-row {
  font-weight: 600;
}

@media print {
  .print-button-container {
    display: none;
  }

  .printable-page {
    width: 100%;
    height: auto;
    padding: 0;
  }

  body {
    background: white !important;
    margin: 0;
    padding: 0;
  }
}
</style>
