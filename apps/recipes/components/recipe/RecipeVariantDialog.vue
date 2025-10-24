<script setup lang="ts">
import { RecipeType } from '~/shared/constants'
import type { Material, OptionMap, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'

const props = defineProps({
  recipeMaster: {
    type: Object as PropType<RecipeProgramMaster>,
    required: true,
  },
})

const selectedProgram = ref(-1)
const selectedRowForReplacement = ref<RecipeMasterMaterial | null>(null)
const variant = ref({
  recipeId: props.recipeMaster.recipeId,
  machineId: props.recipeMaster.machineId,
  variantName: '',
  colorName: '',
  colorCode: 0,
})
const colorString = ref('rgb(0,0,0)')
const formRef = ref()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const { t } = useI18n()
const units: OptionMap[] = [
  { id: 0, name: t('units.0') },
  { id: 1, name: t('units.1') },
  { id: 2, name: t('units.2') },
  { id: 3, name: t('units.3') },
  { id: 4, name: t('units.4') },
  { id: 5, name: t('units.5') },
  { id: 6, name: t('units.6') },
]
const recipe = ref<RecipeMasterStep[]>([])
const columns = [
  { name: 'orderNo', label: t('recipeFields.OrderNo'), align: 'left', field: 'orderNo' },
  { name: 'type', label: t('materialFields.Type'), align: 'left', field: 'type' },
  { name: 'materialCode', label: t('materialFields.Code'), align: 'left', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'left', field: 'materialName' },
  { name: 'amount', label: t('Amount'), align: 'left', field: 'amount' },
  { name: 'unit', label: t('jobOrderParams.Unit'), align: 'left', field: 'unit' },
  { name: 'actions', label: '', align: 'center', field: 'actions' },
]
const materials = ref<Material[]>([])
const materialOptions = ref<Material[]>([])
const selectedMaterial = ref<Material>()
getRecipeSteps()
getMaterials()
async function getRecipeSteps() {
  recipe.value = await $fetch(`/api/recipes/master/steps/${props.recipeMaster.recipeId}`, { query: { machineId:  props.recipeMaster.machineId} })
}
function getAllMaterialsFromSteps(program: RecipeMasterStep) {
  const materials = program.steps.flatMap(step =>
    step.materials.map(material => ({
      ...material,
    })),
  )
  return materials.sort((a, b) => a.orderNo - b.orderNo)
}
async function getMaterials() {
  materials.value = await $fetch('/api/materials')
  materialOptions.value = materials.value
}
function getMaterialName(material: Material) {
  return `${material.materialCode} - ${material.materialName}`
}
function filterMaterials(val: any, update: (param: any) => void) {
  update(() => {
    const needle = val.toLowerCase()
    materialOptions.value = materials.value.filter(material => `${material.materialCode} - ${material.materialName.toLowerCase()}`.includes(needle) && material.materialGroupNo === RecipeType.DYE + 1)
  })
}
function updateAmount(programIndex: number, row: RecipeMasterMaterial) {
  const step = recipe.value[programIndex].steps.find(step => step.stepNo === row.programIndex && step.type === row.type)
  const material = step!.materials.find(material => material.materialCode === row.materialCode && material.orderNo === row.orderNo)
  material!.amount = row.amount
}
function updateUnit(programIndex: number, row: RecipeMasterMaterial) {
  const step = recipe.value[programIndex].steps.find(step => step.stepNo === row.programIndex && step.type === row.type)
  const material = step!.materials.find(material => material.materialCode === row.materialCode && material.orderNo === row.orderNo)
  material!.unit = row.unit
}
function onAddMaterial(programIndex: number) {
  selectedProgram.value = programIndex
  selectedRowForReplacement.value = null
}
function onReplaceMaterial(programIndex: number, row: RecipeMasterMaterial) {
  if (row.type === RecipeType.DYE) {
    selectedProgram.value = programIndex
    selectedRowForReplacement.value = row
  }
}
function onMaterialSelected(material: RecipeMasterMaterial) {
  const program = recipe.value[selectedProgram.value]

  if (selectedRowForReplacement.value) {
    const step = program.steps.find(step => step.stepNo === selectedRowForReplacement.value!.programIndex && step.type === selectedRowForReplacement.value!.type)

    if (step) {
      const materialIndex = step.materials.findIndex(
        m => m.materialCode === selectedRowForReplacement.value!.materialCode && m.orderNo === selectedRowForReplacement.value!.orderNo,
      )

      if (materialIndex !== -1) {
        const originalMaterial = step.materials[materialIndex]
        const newMaterial = {
          ...material,
          amount: originalMaterial.amount,
          unit: originalMaterial.unit,
          programIndex: selectedRowForReplacement.value!.programIndex,
          type: RecipeType.DYE,
          orderNo: originalMaterial.orderNo,
        }

        step.materials[materialIndex] = newMaterial
      }
    }
  } else {
    let step = program.steps.find(step => step.type === RecipeType.DYE)
    let isNewStep = false
    if (!step) {
      isNewStep = true
      step = {
        stepNo: selectedProgram.value,
        type: RecipeType.DYE,
        materials: [],
      }
      program.steps.push(step)
    }
    material.amount = 1
    material.unit = 0
    material.programIndex = selectedProgram.value
    material.type = RecipeType.DYE
    if (isNewStep) {
      let highestOrderNo = 0
      program.steps.forEach((s) => {
        s.materials.forEach((m) => {
          if (m.orderNo > highestOrderNo) {
            highestOrderNo = m.orderNo
          }
        })
      })
      material.orderNo = highestOrderNo + 1
    } else {
      if (step.materials.length > 0) {
        material.orderNo = step.materials[0].orderNo
      } else {
        material.orderNo = 1
      }
    }
    step.materials.push(material)
  }

  selectedProgram.value = -1
  selectedRowForReplacement.value = null
  selectedMaterial.value = undefined
}

function removeMaterial(programIndex: number, row: RecipeMasterMaterial) {
  const program = recipe.value[programIndex]
  const step = program.steps.find(step => step.stepNo === row.programIndex && step.type === row.type)

  if (step) {
    const materialIndex = step.materials.findIndex(
      material => material.materialCode === row.materialCode && material.orderNo === row.orderNo,
    )

    if (materialIndex !== -1) {
      step.materials.splice(materialIndex, 1)
      if (step.materials.length === 0) {
        const stepIndex = program.steps.findIndex(s => s.stepNo === step.stepNo && s.type === step.type)
        if (stepIndex !== -1) {
          program.steps.splice(stepIndex, 1)
        }
      }
    }
  }
}

function cancelReplace() {
  selectedProgram.value = -1
  selectedRowForReplacement.value = null
  selectedMaterial.value = undefined
}

function onCancel() {
  onDialogCancel()
}
async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    const errorEl = document.querySelector('.q-field--error')
    if (errorEl) {
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = errorEl.querySelector('input')
      if (input)
        input.focus()
    }
    return
  }
  await $fetch(`/api/recipes/variant/${props.recipeMaster.recipeId}`, {
    method: 'POST',
    body: {
      variant: variant.value,
      steps: recipe.value,
    },
    query: {
      machineId: props.recipeMaster.machineId
    }
  })
  onDialogOK(variant.value)
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
      <QForm
        ref="formRef"
        @submit.prevent
      >
        <div class="text-center pt-5 text-xl">
          <h2>{{ t('RecipeVariant') }}: {{ recipeMaster.recipeName }}</h2>
        </div>

        <div class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <QInput
                v-model="variant.variantName"
                :label="t('Variant Name')"
                filled
                dense
                :rules="[val => !!val]"
              />
            </div>
            <div class="col-12 col-sm-4">
              <QInput
                v-model="variant.colorName"
                class="item-input"
                dense
                :label="t('jobOrderParams.ColorName')"
                type="text"
                filled
              />
            </div>
            <div class="col-12 col-sm-4">
              <QInput
                v-model="variant.colorCode"
                filled
                dense
                readonly
                :label="t('jobOrderParams.ColorCode')"
                class="item-input"
                hide-bottom-space
              >
                <template #append>
                  <QIcon
                    name="colorize"
                    class="cursor-pointer"
                    :style="`color: ${colorString}`"
                  >
                    <QPopupProxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <QColor
                        v-model="colorString"
                        format-model="rgb"
                        @update:model-value="(val) => variant.colorCode = rgbStringToColorCode(val)"
                      />
                    </QPopupProxy>
                  </QIcon>
                </template>
              </QInput>
            </div>
          </div>
        </div>

        <div class="flex-center w-full">
          <div class="col-8">
            <div
              v-for="(program, programIndex) in recipe"
              :key="program.programNo"
              class="row mb-2"
            >
              <div class="col">
                <div class="row flex-center">
                  <h3
                    flex-center
                    text-xl
                    font-bold
                    my-3
                  >
                    {{ program.programName }}
                  </h3>
                </div>
                <QTable
                  :rows="getAllMaterialsFromSteps(program)"
                  :rows-per-page-options="[0]"
                  :columns
                >
                  <template #body="props">
                    <QTr
                      v-if="selectedRowForReplacement
                        && selectedRowForReplacement.orderNo === props.row.orderNo
                        && selectedRowForReplacement.materialCode === props.row.materialCode
                        && selectedProgram === programIndex"
                      class="replacing-dye-row"
                    >
                      <QTd colspan="7" class="p-4">
                        <div class="font-bold mb-2">
                          {{ t('ReplaceDye') }}: {{ props.row.materialCode }} - {{ props.row.materialName }}
                        </div>
                        <div class="flex items-center">
                          <QSelect
                            v-model="selectedMaterial"
                            class="flex-grow"
                            borderless
                            clearable
                            dense
                            filled
                            use-input
                            input-debounce="0"
                            :option-label="getMaterialName"
                            :options="materialOptions"
                            @filter="(val, doneFn) => filterMaterials(val, doneFn)"
                            @update:model-value="onMaterialSelected"
                          />
                          <QBtn
                            class="ml-2"
                            flat
                            color="negative"
                            icon="close"
                            @click="cancelReplace"
                          />
                        </div>
                      </QTd>
                    </QTr>
                    <QTr
                      v-else
                      :class="{ 'cursor-pointer': props.row.type === RecipeType.DYE, 'dye-row': props.row.type === RecipeType.DYE }"
                      @click="props.row.type === RecipeType.DYE && onReplaceMaterial(programIndex, props.row)"
                    >
                      <QTd
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                      >
                        <span v-if="col.field === 'type'">
                          {{ t(`materialTypes.${props.row.type + 1}`) }}
                        </span>
                        <span
                          v-else-if="col.field === 'materialName'"
                          font-size-4
                          font-900
                          :class="{ 'hover:underline hover:text-blue-600': props.row.type === RecipeType.DYE }"
                        >
                          {{ props.row[col.field] }}
                        </span>
                        <span v-else-if="col.field === 'amount'">
                          <QInput
                            v-model.number="props.row.amount"
                            type="number"
                            step="any"
                            min="0"
                            dense
                            borderless
                            @update:model-value="updateAmount(programIndex, props.row)"
                            @click.stop
                          />
                        </span>
                        <span v-else-if="col.field === 'unit'">
                          <QSelect
                            v-model="props.row.unit"
                            borderless
                            dense
                            filled
                            emit-value
                            map-options
                            options-dense
                            option-value="id"
                            option-label="name"
                            :options="units"
                            @update:model-value="updateUnit(programIndex, props.row)"
                            @click.stop
                          />
                        </span>
                        <span v-else-if="col.field === 'actions' && props.row.type === RecipeType.DYE">
                          <QBtn
                            round
                            flat
                            dense
                            icon="remove"
                            @click.stop="removeMaterial(programIndex, props.row)"
                          >
                            <QTooltip :offset="[0, 5]">
                              {{ t('Remove') }}
                            </QTooltip>
                          </QBtn>
                        </span>
                        <span v-else>
                          {{ props.row[col.field] }}
                        </span>
                      </QTd>
                    </QTr>
                  </template>
                  <template #bottom>
                    <QBtn
                      v-if="selectedProgram === -1 || (selectedRowForReplacement === null && selectedProgram !== programIndex)"
                      w-full
                      rounded
                      icon="add"
                      @click="onAddMaterial(programIndex)"
                    >
                      <QTooltip :offset="[0, 5]">
                        {{ t('AddNewDye') }}
                      </QTooltip>
                    </QBtn>
                    <div
                      v-if="programIndex === selectedProgram && !selectedRowForReplacement"
                      class="p-4 add-dye-section"
                      w-full
                    >
                      {{ t('AddNewDye') }}:
                      <QSelect
                        v-model="selectedMaterial"
                        borderless
                        clearable
                        dense
                        filled
                        use-input
                        input-debounce="0"
                        :option-label="getMaterialName"
                        :options="materialOptions"
                        @filter="(val, doneFn) => filterMaterials(val, doneFn)"
                        @update:model-value="onMaterialSelected"
                      />
                      <QBtn
                        mt-2
                        :label="t('Cancel')"
                        icon="cancel"
                        @click="cancelReplace"
                      />
                    </div>
                  </template>
                </QTable>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-button-section">
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
      </QForm>
    </QCard>
  </QDialog>
</template>

<style scoped>
.dye-row:not(.body--dark *) {
  background-color: orange !important;
}

.replacing-dye-row:not(.body--dark *) {
  animation: highlight-pulse 2s infinite alternate;
}

.body--dark .dye-row {
  background-color: orange !important;
}

.body--dark .replacing-dye-row {
  animation: dark-highlight-pulse 2s infinite alternate;
}

.body--dark .add-dye-section {
  background-color: #1e293b;
}
@keyframes highlight-pulse {
  from {
    background-color: rgba(191, 219, 254, 0.6);
  }
  to {
    background-color: rgba(191, 219, 254, 1);
  }
}
@keyframes dark-highlight-pulse {
  from {
    background-color: rgba(30, 58, 138, 0.6);
  }
  to {
    background-color: rgba(30, 58, 138, 0.9);
  }
}
</style>
