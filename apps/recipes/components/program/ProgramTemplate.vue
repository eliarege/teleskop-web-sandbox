<script setup lang="ts">
import { klona } from 'klona'
import draggable from 'vuedraggable'
import type { OptionMap, ProgramHeader, RecipeMasterMaterial, RecipeMasterStep } from '~/shared/types'
import { RecipeType } from '~/shared/constants'
import { useStateStore } from '~/store/State'

const props = defineProps({
  isNew: {
    type: Boolean,
  },
  programHeader: {
    type: Object as PropType<ProgramHeader>,
    required: true,
  },
})

const q = useQuasar()
const stateStore = useStateStore()
const programHeader = toRef(props, 'programHeader')
const program = ref<RecipeMasterStep>()
const editedProgram = ref<RecipeMasterStep>()
const hasEmptyMaterials = ref(false)
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedProgram.value) !== JSON.stringify(program.value)
  )
})
defineExpose({
  onReset,
  onSave,
  onChange,
  hasChanges,
  programHeader,
})

watch(() => programHeader.value, (header) => {
  if (!editedProgram.value)
    return

  editedProgram.value.chemSteps = adjustStepCount(
    editedProgram.value.chemSteps,
    header.chemRequests,
  )

  editedProgram.value.dyeSteps = adjustStepCount(
    editedProgram.value.dyeSteps,
    header.dyeRequests,
  )

  editedProgram.value.saltSteps = adjustStepCount(
    editedProgram.value.saltSteps,
    header.saltRequests,
  )

  recalculateAllOrderNumbers()

  validateMaterials()
  onChange()
}, { deep: true })

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

getProgram()
async function getProgram() {
  if (!props.isNew) {
    program.value = await $fetch(`/api/programs/templates/${programHeader.value.programNo}`, { query: { machineId: stateStore.defaultMachine } })

    if (program.value) {
      const chemSteps = program.value.steps.filter(step => step.type === RecipeType.CHEM)
      program.value.chemSteps = ensureStepCount(
        groupMaterialsByOrderNo(getAllMaterialsFromSteps(chemSteps)),
        programHeader.value.chemRequests,
      )

      const dyeSteps = program.value.steps.filter(step => step.type === RecipeType.DYE)
      program.value.dyeSteps = ensureStepCount(
        groupMaterialsByOrderNo(getAllMaterialsFromSteps(dyeSteps)),
        programHeader.value.dyeRequests,
      )

      const saltSteps = program.value.steps.filter(step => step.type === RecipeType.SALT)
      program.value.saltSteps = ensureStepCount(
        groupMaterialsByOrderNo(getAllMaterialsFromSteps(saltSteps)),
        programHeader.value.saltRequests,
      )
    }
  }
  editedProgram.value = klona(program.value)
  validateMaterials()
}

function groupMaterialsByOrderNo(materials: RecipeMasterMaterial[]) {
  const grouped: Record<number, { orderNo: number, materials: RecipeMasterMaterial[] }> = {}

  materials.forEach((material) => {
    if (!grouped[material.orderNo]) {
      grouped[material.orderNo] = { orderNo: material.orderNo, materials: [] }
    }
    grouped[material.orderNo].materials.push(material)
  })

  return Object.values(grouped)
}

function ensureStepCount(steps: { orderNo: number, materials: RecipeMasterMaterial[] }[], requiredCount: number) {
  const filledSteps = [...steps]

  for (let i = filledSteps.length + 1; i <= requiredCount; i++) {
    filledSteps.push({ orderNo: i, materials: [] })
  }
  while (filledSteps.length > requiredCount) {
    filledSteps.pop()
  }
  return filledSteps
}

function adjustStepCount(steps: { orderNo: number, materials: RecipeMasterMaterial[] }[], newCount: number) {
  if (steps.length === newCount)
    return steps

  if (steps.length < newCount) {
    return ensureStepCount(steps, newCount)
  } else {
    const result = [...steps.slice(0, newCount)]
    return result
  }
}

function getAllSteps() {
  if (!editedProgram.value)
    return []

  return [
    ...(editedProgram.value.chemSteps || []),
    ...(editedProgram.value.dyeSteps || []),
    ...(editedProgram.value.saltSteps || []),
  ]
}

function recalculateAllOrderNumbers() {
  if (!editedProgram.value)
    return

  let currentOrderNo = 1

  if (editedProgram.value.chemSteps) {
    editedProgram.value.chemSteps.forEach((step) => {
      step.orderNo = currentOrderNo++
      step.materials.forEach((material) => {
        material.orderNo = step.orderNo
      })
    })
  }

  if (editedProgram.value.dyeSteps) {
    editedProgram.value.dyeSteps.forEach((step) => {
      step.orderNo = currentOrderNo++
      step.materials.forEach((material) => {
        material.orderNo = step.orderNo
      })
    })
  }

  if (editedProgram.value.saltSteps) {
    editedProgram.value.saltSteps.forEach((step) => {
      step.orderNo = currentOrderNo++
      step.materials.forEach((material) => {
        material.orderNo = step.orderNo
      })
    })
  }
}

function validateMaterials() {
  if (!editedProgram.value) {
    hasEmptyMaterials.value = false
    return
  }

  // const allSteps = getAllSteps()
  hasEmptyMaterials.value = editedProgram.value.chemSteps.some(step => step.materials.length === 0)
}

const table = ref()
const selectedStep = ref<{ step: any, type: RecipeType, stepIndex: number } | null>(null)

function onAddMaterial(event: any, type: RecipeType, step: any) {
  const item = event.item._underlying_vm_
  item.programNo = programHeader.value.programNo
  const index = event.newDraggableIndex
  if (editedProgram.value) {
    if (type === RecipeType.CHEM) {
      if (type !== item.type) {
        onRemoveItem(step.materials, index)
      } else {
        item.orderNo = step.orderNo
      }
    } else if (type === RecipeType.DYE) {
      if (type !== item.type) {
        onRemoveItem(step.materials, index)
      } else {
        item.orderNo = step.orderNo
      }
    } else if (type === RecipeType.SALT) {
      if (type !== item.type) {
        onRemoveItem(step.materials, index)
      } else {
        item.orderNo = step.orderNo
      }
    }
    validateMaterials()
  }
}

function moveItem(index: number, steps: any, from: number, to: number) {
  if (from === to || !steps[from] || !steps[to])
    return
  const item = steps[from].materials.splice(index, 1)[0]
  if (!item)
    return
  item.orderNo = steps[to].orderNo
  steps[to].materials.push(item)
  validateMaterials()
}

function changeItem(steps: any, event: any) {
  if (event.moved) {
    const item = event.moved.element
    const index = event.moved.newIndex
    if (index === 0)
      item.orderNo = 0
    else
      item.orderNo = steps[index - 1].orderNo
  }
  validateMaterials()
}

function updateStepNo(val: number, type: RecipeType, step: any, steps: any[], refs: any) {
  if (!val || !editedProgram.value)
    return

  const totalSteps
    = (editedProgram.value.chemSteps?.length || 0)
    + (editedProgram.value.dyeSteps?.length || 0)
    + (editedProgram.value.saltSteps?.length || 0)

  const validatedVal = Math.max(1, Math.min(val, totalSteps))

  if (validatedVal !== val) {
    step.orderNo = validatedVal
    step.materials.forEach(material => material.orderNo = validatedVal)
    recalculateAllOrderNumbers()
    return
  }

  const allStepsWithMetadata = [
    ...(editedProgram.value.chemSteps || []).map(s => ({ step: s, type: RecipeType.CHEM })),
    ...(editedProgram.value.dyeSteps || []).map(s => ({ step: s, type: RecipeType.DYE })),
    ...(editedProgram.value.saltSteps || []).map(s => ({ step: s, type: RecipeType.SALT })),
  ]

  allStepsWithMetadata.sort((a, b) => a.step.orderNo - b.step.orderNo)

  const currentStepIndex = allStepsWithMetadata.findIndex(item => item.step === step)

  const targetPosition = validatedVal - 1

  if (currentStepIndex === targetPosition) {
    return
  }

  const [movedStep] = allStepsWithMetadata.splice(currentStepIndex, 1)

  allStepsWithMetadata.splice(targetPosition, 0, movedStep)

  allStepsWithMetadata.forEach((item, idx) => {
    item.step.orderNo = idx + 1
    item.step.materials.forEach(material => material.orderNo = idx + 1)
  })

  if (editedProgram.value.chemSteps) {
    editedProgram.value.chemSteps.sort((a, b) => a.orderNo - b.orderNo)
  }
  if (editedProgram.value.dyeSteps) {
    editedProgram.value.dyeSteps.sort((a, b) => a.orderNo - b.orderNo)
  }
  if (editedProgram.value.saltSteps) {
    editedProgram.value.saltSteps.sort((a, b) => a.orderNo - b.orderNo)
  }

  const newIndex = steps.findIndex(s => s === step)
  const refName = `orderNo${type},${newIndex}`
  const inputRef = refs[refName]?.[0] as HTMLInputElement
  if (inputRef) {
    inputRef.focus()
  }
}

function onRemoveItem(materials: any, index: number) {
  materials.splice(index, 1)
  validateMaterials()
}

function onChange() {
  validateMaterials()
}

function onReset() {
  editedProgram.value = klona(program.value)
  recalculateAllOrderNumbers()
  validateMaterials()
}

async function onSave() {
  if (!hasChanges.value)
    return true
  validateMaterials()

  if (hasEmptyMaterials.value) {
    q.notify({
      message: t('confirmationDialogBody.EmptyRecipeSteps'),
      color: 'red',
      actions: [
        { color: 'white', icon: 'close', handler: () => { } },
      ],
      timeout: 9999999999,
    })
    return false
  }

  await $fetch(`/api/programs/templates/${programHeader.value.programNo}`, { method: 'POST', body: { template: editedProgram.value, machineId: stateStore.defaultMachine } })
  return true
}

function selectStep(step: any, type: RecipeType, stepIndex: number) {
  // Unselect
  if (selectedStep.value?.step === step) {
    selectedStep.value = null
    if (table.value) {
      table.value.setSelectedStep(null)
    }
    return
  }

  selectedStep.value = { step, type, stepIndex }

  if (table.value) {
    table.value.setSelectedStep(selectedStep.value)
  }
}

function onMaterialAdded(material: any) {
  if (!selectedStep.value || !editedProgram.value) {
    return
  }

  const { step, type } = selectedStep.value

  const clonedMaterial = {
    materialCode: material.materialCode,
    materialName: material.materialName,
    type: material.materialGroupNo - 1,
    amount: 0,
    unit: material.materialGroupNo - 1 === RecipeType.DYE ? 0 : 1,
    orderNo: step.orderNo,
    mainStep: 1,
    parallelStep: 1,
    programNo: programHeader.value.programNo,
    isManual: material.isManual,
  }

  if (clonedMaterial.type !== type) {
    q.notify({
      message: t('InvalidMaterialType'),
      color: 'negative',
    })
    return
  }

  step.materials.push(clonedMaterial)
  validateMaterials()
  onChange()
}
</script>

<template>
  <QCard>
    <QCardSection>
      <div class="row no-wrap">
        <div class="col-auto recipe-content">
          <QList bordered class="q-pa-md">
            <div v-if="editedProgram">
              <div class="program-card-wrapper">
                <div class="recipe-materials">
                  <!-- CHEM REQUESTS -->
                  <div v-if="programHeader.chemRequests > 0">
                    <h4 class="flex justify-center text-xl my-2">
                      {{ t('programFields.ChemRequests') }}
                    </h4>
                    <div
                      v-for="(step, idx) in editedProgram.chemSteps"
                      :key="idx"
                      class="table-wrapper"
                      :class="{ 'selected-step': selectedStep?.step === step }"
                      my-2
                      @click="selectStep(step, RecipeType.CHEM, idx)"
                    >
                      <div class="flex items-center gap-4">
                        <QInput
                          :ref="`orderNo${RecipeType.CHEM},${idx}`"
                          v-model.number="step.orderNo"
                          pl-5
                          w-10
                          flex-shrink-0
                          autogrow
                          input-style="font-weight: bold; text-align: center;"
                          type="number"
                          reactive-rules
                          min="1"
                          hide-bottom-space
                          @update:model-value="val => updateStepNo(val, RecipeType.CHEM, step, editedProgram.chemSteps, $refs)"
                        />
                        <div class="table-content">
                          <QMarkupTable
                            class="fixed-table"
                            dense
                            overflow-hidden
                            border-gray
                            border-rd-2
                            border-2
                          >
                            <thead>
                              <tr :class="{ 'invisible-header': idx !== 0 }">
                                <th w-10 />
                                <th w-10 />
                                <th w-10 class="text-left">
                                  {{ t('materialFields.IsManual') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('materialFields.Code') }}
                                </th>
                                <th w-20 class="text-center">
                                  {{ t('materialFields.Name') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Amount') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Unit') }}
                                </th>
                              </tr>
                            </thead>
                            <draggable
                              v-model="editedProgram.chemSteps[idx].materials"
                              class="draggable-area"
                              item-key="materialCode"
                              :group="{ name: 'materials', pull: false, disabled: true }"
                              :sort="false"
                              ghost-class="material-ghost"
                              tag="tbody"
                              @add="(e) => onAddMaterial(e, RecipeType.CHEM, step)"
                              @change="(e) => changeItem(editedProgram.chemSteps, e)"
                            >
                              <template #item="{ element, index }">
                                <tr>
                                  <td important-p-0>
                                    <QBtn
                                      icon="close"
                                      flat
                                      pl-2
                                      pr-0
                                      op-70
                                      size="sm"
                                      @click="onRemoveItem(editedProgram.chemSteps[idx].materials, index)"
                                    />
                                  </td>
                                  <td important-p-0>
                                    <div class="column">
                                      <QBtn
                                        icon="keyboard_arrow_up"
                                        :disabled="idx === 0"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.chemSteps, idx, idx - 1)"
                                      />
                                      <QBtn
                                        icon="keyboard_arrow_down"
                                        :disabled="idx === editedProgram.chemSteps.length - 1"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.chemSteps, idx, idx + 1)"
                                      />
                                    </div>
                                  </td>
                                  <td>{{ element.isManual ? t('Yes') : t('No') }}</td>
                                  <td><span>{{ element.materialCode }}</span></td>
                                  <td>
                                    <span font-size-4 font-900>
                                      {{ element.materialName }}
                                    </span>
                                  </td>
                                  <td>
                                    <QInput
                                      v-model.number="element.amount"
                                      dense
                                      step="any"
                                      type="number"
                                      :rules="[(v) => v >= 0]"
                                      min="0"
                                      hide-bottom-space
                                    />
                                  </td>
                                  <td>
                                    <QSelect
                                      v-model="element.unit"
                                      borderless
                                      dense
                                      filled
                                      emit-value
                                      map-options
                                      options-dense
                                      option-value="id"
                                      option-label="name"
                                      :options="units"
                                    />
                                  </td>
                                </tr>
                              </template>
                            </draggable>
                          </QMarkupTable>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- DYE REQUESTS -->
                  <div v-if="programHeader.dyeRequests > 0">
                    <h4 class="flex justify-center text-xl my-2">
                      {{ t('programFields.DyeRequests') }}
                    </h4>
                    <div
                      v-for="(step, idx) in editedProgram.dyeSteps"
                      :key="idx"
                      class="table-wrapper"
                      :class="{ 'selected-step': selectedStep?.step === step }"
                      my-2
                      @click="selectStep(step, RecipeType.DYE, idx)"
                    >
                      <div class="flex items-center gap-4">
                        <QInput
                          :ref="`orderNo${RecipeType.DYE},${idx}`"
                          v-model.number="step.orderNo"
                          pl-5
                          w-10
                          autogrow
                          input-style="font-weight: bold; text-align: center;"
                          type="number"
                          reactive-rules
                          min="1"
                          hide-bottom-space
                          @update:model-value="val => updateStepNo(val, RecipeType.DYE, step, editedProgram.dyeSteps, $refs)"
                        />
                        <div class="table-content">
                          <QMarkupTable
                            class="fixed-table"
                            dense
                            overflow-hidden
                            border-gray
                            bg-orange
                            border-rd-2
                            border-2
                          >
                            <thead>
                              <tr :class="{ 'invisible-header': idx !== 0 }">
                                <th w-10 />
                                <th w-10 />
                                <th w-10 class="text-center">
                                  {{ t('materialFields.Code') }}
                                </th>
                                <th w-20 class="text-center">
                                  {{ t('materialFields.Name') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Amount') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Unit') }}
                                </th>
                              </tr>
                            </thead>
                            <draggable
                              v-model="editedProgram.dyeSteps[idx].materials"
                              class="draggable-area"
                              item-key="materialCode"
                              :group="{ name: 'materials', pull: false }"
                              :sort="false"
                              ghost-class="material-ghost"
                              tag="tbody"
                              @add="(e) => onAddMaterial(e, RecipeType.DYE, step)"
                              @change="(e) => changeItem(editedProgram.dyeSteps[idx], e)"
                            >
                              <template #item="{ element, index }">
                                <tr>
                                  <td important-p-0>
                                    <QBtn
                                      icon="close"
                                      flat
                                      pl-2
                                      pr-0
                                      op-70
                                      size="sm"
                                      @click="onRemoveItem(editedProgram.dyeSteps[idx].materials, index)"
                                    />
                                  </td>
                                  <td important-p-0>
                                    <div class="column">
                                      <QBtn
                                        icon="keyboard_arrow_up"
                                        :disabled="idx === 0"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.dyeSteps, idx, idx - 1)"
                                      />
                                      <QBtn
                                        icon="keyboard_arrow_down"
                                        :disabled="idx === editedProgram.dyeSteps.length - 1"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.dyeSteps, idx, idx + 1)"
                                      />
                                    </div>
                                  </td>
                                  <td><span>{{ element.materialCode }}</span></td>
                                  <td>
                                    <span font-size-4 font-900>
                                      {{ element.materialName }}
                                    </span>
                                  </td>
                                  <td>
                                    <QInput
                                      v-model.number="element.amount"
                                      dense
                                      step="any"
                                      type="number"
                                      :rules="[(v) => v >= 0]"
                                      min="0"
                                      hide-bottom-space
                                    />
                                  </td>
                                  <td>
                                    <QSelect
                                      v-model="element.unit"
                                      borderless
                                      dense
                                      filled
                                      emit-value
                                      map-options
                                      options-dense
                                      option-value="id"
                                      option-label="name"
                                      :options="units"
                                    />
                                  </td>
                                </tr>
                              </template>
                            </draggable>
                          </QMarkupTable>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- SALT REQUESTS -->
                  <div v-if="programHeader.saltRequests > 0">
                    <h4 class="flex justify-center text-xl my-2">
                      {{ t('programFields.SaltRequests') }}
                    </h4>
                    <div
                      v-for="(step, idx) in editedProgram.saltSteps"
                      :key="idx"
                      class="table-wrapper"
                      :class="{ 'selected-step': selectedStep?.step === step }"
                      my-2
                      @click="selectStep(step, RecipeType.SALT, idx)"
                    >
                      <div class="flex items-center gap-4">
                        <QInput
                          :ref="`orderNo${RecipeType.SALT},${idx}`"
                          v-model.number="step.orderNo"
                          pl-5
                          w-10
                          autogrow
                          input-style="font-weight: bold; text-align: center;"
                          type="number"
                          reactive-rules
                          min="1"
                          hide-bottom-space
                          @update:model-value="val => updateStepNo(val, RecipeType.SALT, step, editedProgram.saltSteps, $refs)"
                        />
                        <div class="table-content">
                          <QMarkupTable
                            class="fixed-table"
                            dense
                            overflow-hidden
                            border-gray
                            bg-light-blue
                            border-rd-2
                            border-2
                          >
                            <thead>
                              <tr :class="{ 'invisible-header': idx !== 0 }">
                                <th w-10 />
                                <th w-10 />
                                <th w-10 class="text-center">
                                  {{ t('materialFields.Code') }}
                                </th>
                                <th w-20 class="text-center">
                                  {{ t('materialFields.Name') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Amount') }}
                                </th>
                                <th w-10 class="text-center">
                                  {{ t('recipeFields.Unit') }}
                                </th>
                              </tr>
                            </thead>
                            <draggable
                              v-model="editedProgram.saltSteps[idx].materials"
                              class="draggable-area"
                              item-key="materialCode"
                              :group="{ name: 'materials', pull: false }"
                              :sort="false"
                              ghost-class="material-ghost"
                              tag="tbody"
                              @add="(e) => onAddMaterial(e, RecipeType.SALT, step)"
                              @change="(e) => changeItem(editedProgram.saltSteps, e)"
                            >
                              <template #item="{ element, index }">
                                <tr>
                                  <td important-p-0>
                                    <QBtn
                                      icon="close"
                                      flat
                                      pl-2
                                      pr-0
                                      op-70
                                      size="sm"
                                      @click="onRemoveItem(editedProgram.saltSteps[idx].materials, index)"
                                    />
                                  </td>
                                  <td important-p-0>
                                    <div class="column">
                                      <QBtn
                                        icon="keyboard_arrow_up"
                                        :disabled="idx === 0"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.saltSteps, idx, idx - 1)"
                                      />
                                      <QBtn
                                        icon="keyboard_arrow_down"
                                        :disabled="idx === editedProgram.saltSteps.length - 1"
                                        flat
                                        p-0
                                        @click="moveItem(index, editedProgram.saltSteps, idx, idx + 1)"
                                      />
                                    </div>
                                  </td>
                                  <td><span>{{ element.materialCode }}</span></td>
                                  <td>
                                    <span font-size-4 font-900>
                                      {{ element.materialName }}
                                    </span>
                                  </td>
                                  <td>
                                    <QInput
                                      v-model.number="element.amount"
                                      dense
                                      step="any"
                                      type="number"
                                      :rules="[(v) => v >= 0]"
                                      min="0"
                                      hide-bottom-space
                                    />
                                  </td>
                                  <td>
                                    <QSelect
                                      v-model="element.unit"
                                      borderless
                                      dense
                                      filled
                                      emit-value
                                      map-options
                                      options-dense
                                      option-value="id"
                                      option-label="name"
                                      :options="units"
                                    />
                                  </td>
                                </tr>
                              </template>
                            </draggable>
                          </QMarkupTable>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </QList>
        </div>

        <div class="col-auto material-table-container">
          <MaterialTable
            ref="table"
            is-draggable
            @material-added="onMaterialAdded"
          />
        </div>
      </div>
    </QCardSection>
  </QCard>
</template>

<style scoped>
.program-card {
  width: 350px;
  flex-grow: 1;
  flex-shrink: 0;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
  cursor: pointer;
  padding: 3rem;
}
.program-card:hover {
  background-color: rgba(120, 120, 120, 0.5);
  transform: scale(1.02);
}
.program-card-container {
  display: flex;
  align-items: flex-start;
}
.program-card-wrapper {
  display: flex;
  align-items: stretch;
}
.recipe-materials {
  flex-grow: 1;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  width: 100%;
  margin: 0 1rem;
}
.table-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.table-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.table-content {
  width: 700px;
  flex-shrink: 0;
}
:deep(.fixed-table .q-markup-table__overflow table) {
  width: 100% !important;
  table-layout: fixed !important;
}
.invisible-header {
  visibility: collapse !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}
/* fixed column widths */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(1)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(1)) {
  width: 40px !important;
}
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(2)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(2)) {
  width: 80px !important;
}
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(3)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(3)) {
  width: 120px !important;
}
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(4)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(4)) {
  width: 200px !important;
}
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(5)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(5)),
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(6)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(6)) {
  width: 80px !important;
}
.recipe-content {
  min-width: 850px;
  flex: 1 1 auto;
}

.material-table-container {
  position: sticky;
  top: 0;
  right: 0;
  width: 420px;
  height: 100vh;
  max-height: calc(100vh - 100px);
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 10;
  flex: 0 0 420px;
}

.row {
  flex-wrap: nowrap !important;
}

.selected-step {
  background-color: rgba(25, 118, 210, 0.1);
  border: 2px solid #1976d2;
  border-radius: 4px;
  cursor: pointer;
}
</style>
