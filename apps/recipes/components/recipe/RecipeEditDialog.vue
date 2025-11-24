<script setup lang="ts">
import { klona } from 'klona'
import draggable from 'vuedraggable'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { Material, OptionMap, ProgramHeader, RecipeMasterMaterial, RecipeMasterStep, RecipeProgramMaster } from '~/shared/types'
import { RecipeType } from '~/shared/constants'
import { rgbStringToColorCode } from '~/utils/utils'

const props = defineProps({
  recipeId: {
    type: Number,
    required: true,
  },
  machineId: {
    type: Number,
    required: true,
  },
  isNew: {
    type: Boolean,
  },
})

const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const q = useQuasar()
const { notifyFail } = useNotify()
const recipe = ref<RecipeProgramMaster>()
const editedRecipe = ref<RecipeProgramMaster>()
const defaultRecipe: RecipeProgramMaster = {
  recipeId: props.recipeId,
  recipeName: '',
  recipeGroup: 0,
  recipeType: 0,
  machineId: props.machineId,
  comment: '',
  stepNo: 0,
  programNo: 0,
  isPassive: false,
  prepTime: new Date(),
  lastUpdate: new Date(),
  colorCode: 0,
  colorName: '',
}
const colorString = ref('rgb(0, 0, 0)')
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
const types: OptionMap[] = [{ id: 0, name: t('recipeGroups.0') }, { id: 1, name: t('recipeGroups.1') }, { id: 2, name: t('recipeGroups.2') }, { id: 3, name: t('recipeGroups.3') }]
const programs = ref<RecipeMasterStep[]>([])
const editedPrograms = ref<RecipeMasterStep[]>()
const table = ref()
const programSelection = ref<number | null>(null)
const programList = ref<ProgramHeader[]>([])
const programOptions = ref<ProgramHeader[]>([])
const selectedProgram = ref<ProgramHeader>()
const materials = ref<Material[]>([])
const materialOptions = ref<Material[]>([])
const selectedMaterial = ref<Material>()
const materialSelection = ref<{
  program: number
  step: number
  type: number
} | null>(null)
getPrograms()
getMaterials()
getRecipe()
async function getRecipe() {
  if (!props.isNew) {
    recipe.value = await $fetch(`/api/recipes/master/${props.recipeId}`, { query: { machineId: props.machineId } })
    editedRecipe.value = klona(recipe.value)
  } else {
    editedRecipe.value = klona(defaultRecipe)
  }
  colorString.value = colorCodeToRGB(editedRecipe.value!.colorCode)
}
async function getPrograms() {
  programs.value = await $fetch(`/api/recipes/master/steps/${props.recipeId}`, { query: { machineId: props.machineId } })

  for (const program of programs.value) {
    const chemSteps = program.steps.filter(step => step.type === RecipeType.CHEM)
    program.chemSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(chemSteps)),
      program.chemRequests,
    )
    const dyeSteps = program.steps.filter(step => step.type === RecipeType.DYE)
    program.dyeSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(dyeSteps)),
      program.dyeRequests,
    )
    const saltSteps = program.steps.filter(step => step.type === RecipeType.SALT)
    program.saltSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(saltSteps)),
      program.saltRequests,
    )
  }
  editedPrograms.value = klona(programs.value)
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

  return filledSteps
}

const hasChanges = computed(() => {
  return (
    JSON.stringify(editedRecipe.value) !== JSON.stringify(props.isNew ? defaultRecipe : recipe.value)
    || JSON.stringify(editedPrograms.value) !== JSON.stringify(programs.value)
  )
})
async function getMaterials() {
  materials.value = await $fetch('/api/materials')
  materialOptions.value = materials.value
}
async function addProgram(index: number) {
  if (programList.value.length === 0)
    await getProgramList()
  programSelection.value = index
}
function removeProgram(index: number) {
  editedPrograms.value?.splice(index, 1)
  if (editedPrograms.value) {
    for (let i = index; i < editedPrograms.value.length; i++) {
      const program = editedPrograms.value[i]
      if (program && program.stepNo !== undefined) {
        program.stepNo -= 1
      }
    }
  }
}
async function getProgramList() {
  programList.value = await $fetch(`/api/programs/templates`, { query: { machineId: props.machineId } })
  programOptions.value = programList.value
}

async function onProgramSelect(programHeader: ProgramHeader | undefined) {
  if (programHeader) {
    const template = await $fetch(`/api/programs/templates/${programHeader.programNo}`, { query: { machineId: props.machineId } })
    const program: RecipeMasterStep = {
      recipeId: props.recipeId,
      stepNo: editedPrograms.value.length,
      steps: [],
      ...programHeader,
      chemSteps: [],
      dyeSteps: [],
      saltSteps: [],
    }
    const chemSteps = template.steps.filter(step => step.type === RecipeType.CHEM)
    program.chemSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(chemSteps)),
      program.chemRequests,
    )
    const dyeSteps = template.steps.filter(step => step.type === RecipeType.DYE)
    program.dyeSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(dyeSteps)),
      program.dyeRequests,
    )
    const saltSteps = template.steps.filter(step => step.type === RecipeType.SALT)
    program.saltSteps = ensureStepCount(
      groupMaterialsByOrderNo(getAllMaterialsFromSteps(saltSteps)),
      program.saltRequests,
    )
    if (programSelection.value === editedPrograms.value?.length)
      editedPrograms.value?.push(program)
    else
      editedPrograms.value![programSelection.value!] = program
    programSelection.value = null
    selectedProgram.value = undefined
  }
}
function getProgramName(program: ProgramHeader) {
  return `${program.programNo} - ${program.programName}`
}
function filterPrograms(val: any, update: (param: any) => void) {
  update(() => {
    const needle = val.toLowerCase()
    programOptions.value = programList.value.filter(program => `${program.programNo} - ${program.programName.toLowerCase()}`.includes(needle))
  })
}
function getMaterialName(material: Material) {
  return `${material.materialCode} - ${material.materialName}`
}
function filterMaterials(val: any, type: RecipeType, update: (param: any) => void) {
  update(() => {
    const needle = val.toLowerCase()
    materialOptions.value = materials.value.filter(material => `${material.materialCode} - ${material.materialName.toLowerCase()}`.includes(needle) && material.materialGroupNo === type + 1)
  })
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
}

function onRemoveItem(materials: any, index: number) {
  materials.splice(index, 1)
}
function selectMaterial(program: number, type: RecipeType, step: number) {
  materialSelection.value = { program, type, step }
}

function onMaterialSelected(material: RecipeMasterMaterial) {
  const { program, step, type } = materialSelection.value!
  let stepMaterials: RecipeMasterMaterial[] | undefined

  if (type === RecipeType.CHEM) {
    stepMaterials = editedPrograms.value!.at(program)?.chemSteps.find(order => order.orderNo === step)?.materials
  } else if (type === RecipeType.DYE) {
    stepMaterials = editedPrograms.value!.at(program)?.dyeSteps.find(order => order.orderNo === step)?.materials
  } else if (type === RecipeType.SALT) {
    stepMaterials = editedPrograms.value!.at(program)?.saltSteps.find(order => order.orderNo === step)?.materials
  }
  if (stepMaterials) {
    material.amount = 1
    material.unit = type === RecipeType.DYE ? 0 : 1
    stepMaterials.push(material)
    materialSelection.value = null
    selectedMaterial.value = undefined
  }
}

async function onSave() {
  if (hasChanges.value) {
    const hasEmptySteps = editedPrograms.value?.some(program =>
      program.chemSteps.some(step => step.materials.length === 0),
    )
    if (hasEmptySteps) {
      q.notify({
        message: t('confirmationDialogBody.EmptyRecipeSteps'),
        color: 'red',
        icon: 'cancel',
        actions: [
          { color: 'white', icon: 'close', handler: () => { } },
        ],
        timeout: 9999999999,
      })
    } else {
      try {
        if (props.isNew) {
          await $fetch(`/api/recipes/master/${editedRecipe.value.recipeId}`, {
            method: 'PUT',
            body: { recipeHeader: editedRecipe.value },
          })
        }
        await $fetch(`/api/recipes/master/${editedRecipe.value.recipeId}`, {
          method: 'POST',
          body: { recipeHeader: editedRecipe.value, steps: editedPrograms.value },
        })
        onDialogOK(true)
      } catch (err: any) {
        notifyFail(t('Failed'))
      }
    }
  } else {
    onDialogCancel()
  }
}

function onCancel() {
  if (hasChanges.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.Cancel'),
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
  } else {
    onDialogCancel()
  }
}

function onReset() {
  if (hasChanges.value)
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.Reset'),
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
      editedPrograms.value = klona(programs.value)
      editedRecipe.value = klona(recipe.value)
      materialSelection.value = null
    })
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteRecipe'),
      confirmBtn: {
        label: t('Delete'),
        color: 'negative',
        icon: 'delete',
      },
      cancelBtn: {
        label: t('Cancel'),
        icon: 'close',
      },
    },
  }).onOk(async () => {
    await $fetch(`/api/recipes/master/${props.recipeId}`, { method: 'DELETE', query: { machineId: editedRecipe.value.machineId } })
    onDialogOK(true)
  })
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-height
    full-width
    :persistent="hasChanges"
    @hide="onDialogHide"
  >
    <QCard>
      <QCardSection>
        <div v-if="editedRecipe" class="flex flex-row flex-wrap justify-center">
          <div class="row-item">
            <span class="item-label">
              {{ t('recipeFields.ID') }}
            </span>
            <QInput
              v-model="editedRecipe.recipeId"
              class="item-input"
              dense
              type="number"
              filled
              :disable="!isNew"
            />
          </div>
          <div class="row-item">
            <span class="item-label">
              {{ t('recipeFields.Name') }}
            </span>
            <QInput
              v-model="editedRecipe.recipeName"
              class="item-input"
              dense
              type="text"
              filled
            />
          </div>
          <div class="row-item">
            <span class="item-label">
              {{ t('recipeFields.Type') }}
            </span>
            <QSelect
              v-model="editedRecipe.recipeType"
              borderless
              dense
              filled
              emit-value
              map-options
              options-dense
              option-value="id"
              option-label="name"
              :options="types"
            />
          </div>
          <div class="row-item">
            <span class="item-label">
              {{ t('jobOrderParams.ColorCode') }}
            </span>
            <QInput
              v-model="editedRecipe.colorCode"
              filled
              dense
              readonly
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
                      @update:model-value="(val) => editedRecipe!.colorCode = rgbStringToColorCode(val)"
                    />
                  </QPopupProxy>
                </QIcon>
              </template>
            </QInput>
          </div>
          <div class="row-item">
            <span class="item-label">
              {{ t('jobOrderParams.ColorName') }}
            </span>
            <QInput
              v-model="editedRecipe.colorName"
              class="item-input"
              dense
              type="text"
              filled
            />
          </div>
          <div class="row-item">
            <span class="item-label">
              {{ t('machineFields.ID') }}
            </span>
            <QInput
              v-model="editedRecipe.machineId"
              class="item-input"
              dense
              filled
              disable
            />
          </div>
          <div v-show="false" class="row-item">
            <span class="item-label">
              {{ t('recipeFields.Group') }}
            </span>
            <QSelect
              v-model="editedRecipe.recipeGroup"
              borderless
              dense
              filled
              emit-value
              map-options
              options-dense
              option-value="id"
              option-label="name"
              :options="groups"
            />
          </div>
          <div v-show="false" class="row-item">
            <span class="item-label">
              {{ t('recipeFields.Desc') }}
            </span>
            <QInput
              v-model="editedRecipe.comment"
              class="item-input"
              dense
              type="textarea"
              filled
            />
          </div>
        </div>
        <div class="row">
          <div w-320>
            <QList bordered class="q-pa-md">
              <div
                v-for="(program, programIndex) in editedPrograms"
                :key="programIndex"
                class="q-mb-md program-card-container"
              >
                <div class="program-card-wrapper">
                  <QCard
                    class="program-card"
                    flex-center
                    @click="addProgram(programIndex)"
                  >
                    <div class="index-badge">
                      {{ programIndex + 1 }}
                    </div>
                    <QBtn
                      icon="remove"
                      flat
                      round
                      dense
                      class="absolute top-0 right-0 q-mt-xs q-mr-xs"
                      @click="removeProgram(programIndex)"
                    />
                    <QCardSection v-show="programSelection !== programIndex">
                      <div flex-center text-xl>
                        {{ program.programName }}
                      </div>
                      <p><strong>{{ t('programFields.ChemRequests') }}:</strong> {{ program.chemRequests }}</p>
                      <p><strong>{{ t('programFields.DyeRequests') }}:</strong> {{ program.dyeRequests }}</p>
                      <p><strong>{{ t('programFields.SaltRequests') }}:</strong> {{ program.saltRequests }}</p>
                    </QCardSection>
                    <div v-show="programSelection === programIndex" justify-center>
                      {{ t('SelectProgram') }}:
                      <QSelect
                        v-model="selectedProgram"
                        borderless
                        clearable
                        dense
                        filled
                        use-input
                        input-debounce="0"
                        :option-label="getProgramName"
                        :options="programOptions"
                        @filter="filterPrograms"
                        @update:model-value="onProgramSelect"
                      />
                      <QBtn
                        mt-2
                        :label="t('Cancel')"
                        icon="cancel"
                        @click.stop="programSelection = null; selectedProgram = undefined;"
                      />
                    </div>
                  </QCard>

                  <div class="recipe-materials">
                    <h4 class="flex justify-center text-xl my-2">
                      {{ t('programFields.ChemRequests') }}
                    </h4>
                    <div
                      v-for="(step, idx) in program.chemSteps"
                      :key="idx"
                      class="table-wrapper"
                      my-2
                    >
                      <div class="flex items-start">
                        <h3 class="step-header mr-4 mt-2 text-xl font-bold">
                          {{ step.orderNo }}
                        </h3>

                        <div class="flex gap-4 flex-nowrap">
                          <div class="table-content">
                            <QMarkupTable
                              class="fixed-table"
                              overflow-hidden
                              dense
                              border-gray
                              border-rd-2
                              border-2
                            >
                              <thead>
                                <tr :class="{ 'invisible-header': idx !== 0 }">
                                  <th class="text-left" w-10 />
                                  <th class="text-left" w-10>
                                    {{ t('materialFields.IsManual') }}
                                  </th>
                                  <th class="text-left" w-10>
                                    {{ t('materialFields.Code') }}
                                  </th>
                                  <th class="text-left" w-20>
                                    {{ t('materialFields.Name') }}
                                  </th>
                                  <th class="text-left" w-25>
                                    {{ t('recipeFields.Amount') }}
                                  </th>
                                  <th class="text-left" w-10>
                                    {{ t('recipeFields.Unit') }}
                                  </th>
                                </tr>
                              </thead>
                              <draggable
                                v-model="step.materials"
                                class="draggable-area"
                                item-key="materialCode"
                                :group="{ name: 'materials', pull: false }"
                                :sort="false"
                                ghost-class="material-ghost"
                                tag="tbody"
                                @change="(event) => changeItem(program.chemSteps, event)"
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
                                        @click="onRemoveItem(step.materials, index)"
                                      />
                                    </td>
                                    <td w-10>
                                      {{ element.isManual ? t('Yes') : t('No') }}
                                    </td>
                                    <td w-10>
                                      <span>{{ element.materialCode }}</span>
                                    </td>
                                    <td
                                      w-20
                                      font-size-4
                                      font-900
                                    >
                                      <span>{{ element.materialName }}</span>
                                    </td>
                                    <td w-10>
                                      <QInput
                                        v-model.number="element.amount"
                                        dense
                                        type="number"
                                        :rules="[(val: number) => val >= 0]"
                                        min="0"
                                        hide-bottom-space
                                      />
                                    </td>
                                    <td w-10>
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
                              <tfoot
                                v-show="materialSelection?.program === program.stepNo
                                  && materialSelection?.type === RecipeType.CHEM
                                  && materialSelection?.step === step.orderNo"
                              >
                                <tr>
                                  <td colspan="7">
                                    <div class="p-4" justify-center>
                                      {{ t('AddNewMaterial') }}:
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
                                        @filter="(val, doneFn) => filterMaterials(val, RecipeType.CHEM, doneFn)"
                                        @update:model-value="onMaterialSelected"
                                      />
                                      <QBtn
                                        mt-2
                                        :label="t('Cancel')"
                                        icon="cancel"
                                        @click.stop="materialSelection = null; selectedMaterial = undefined;"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                            </QMarkupTable>
                          </div>
                          <div v-show="!materialSelection" class="flex flex-col justify-center">
                            <div
                              class="border-2 border-gray-300 rounded-full hover:border-primary hover:bg-primary-light transition-all duration-200 cursor-pointer group"
                            >
                              <QBtn
                                round
                                flat
                                icon="add"
                                class="transition-colors duration-200"
                                @click="selectMaterial(program.stepNo, RecipeType.CHEM, step.orderNo)"
                              >
                                <QTooltip
                                  transition-show="scale"
                                  transition-hide="scale"
                                  :offset="[8, 0]"
                                  anchor="center right"
                                  self="center left"
                                >
                                  {{ t('AddNewMaterial') }}
                                </QTooltip>
                              </QBtn>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Dye Requests Section -->
                    <div>
                      <h4 class="flex justify-center text-xl my-2">
                        {{ t('programFields.DyeRequests') }}
                      </h4>
                      <div
                        v-for="(step, idx) in program.dyeSteps"
                        :key="idx"
                        class="table-wrapper"
                        my-2
                      >
                        <div class="flex items-start">
                          <h3 class="step-header mr-4 mt-2 text-xl font-bold">
                            {{ step.orderNo }}
                          </h3>

                          <div class="flex gap-4 flex-nowrap">
                            <!-- fixed-width table -->
                            <div class="table-content">
                              <QMarkupTable
                                class="fixed-table"
                                overflow-hidden
                                dense
                                border-gray
                                bg-orange
                                border-rd-2
                                border-2
                              >
                                <thead>
                                  <tr :class="{ 'invisible-header': idx !== 0 }">
                                    <th class="text-left" w-10 />
                                    <th class="text-left" w-10>
                                      {{ t('materialFields.IsManual') }}
                                    </th>
                                    <th class="text-center" w-10>
                                      {{ t('materialFields.Code') }}
                                    </th>
                                    <th class="text-center" w-20>
                                      {{ t('materialFields.Name') }}
                                    </th>
                                    <th class="text-center" w-25>
                                      {{ t('recipeFields.Amount') }}
                                    </th>
                                    <th class="text-center" w-10>
                                      {{ t('recipeFields.Unit') }}
                                    </th>
                                  </tr>
                                </thead>
                                <draggable
                                  v-model="step.materials"
                                  item-key="materialCode"
                                  class="draggable-area"
                                  :group="{ name: 'materials', pull: false }"
                                  :sort="false"
                                  ghost-class="material-ghost"
                                  tag="tbody"
                                  @change="(e) => changeItem(program.dyeSteps, e)"
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
                                          @click="onRemoveItem(step.materials, index)"
                                        />
                                      </td>
                                      <td w-10>
                                        {{ element.isManual ? t('Yes') : t('No') }}
                                      </td>
                                      <td w-10>
                                        <span>{{ element.materialCode }}</span>
                                      </td>
                                      <td
                                        w-20
                                        font-size-4
                                        font-900
                                      >
                                        <span>{{ element.materialName }}</span>
                                      </td>
                                      <td w-10>
                                        <QInput
                                          v-model.number="element.amount"
                                          dense
                                          type="number"
                                          :rules="[(v) => v >= 0]"
                                          min="0"
                                          hide-bottom-space
                                        />
                                      </td>
                                      <td w-10>
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
                                <tfoot
                                  v-show="materialSelection?.program === program.stepNo
                                    && materialSelection?.type === RecipeType.DYE
                                    && materialSelection?.step === step.orderNo
                                  "
                                >
                                  <tr>
                                    <td colspan="7">
                                      <div class="p-4" justify-center>
                                        {{ t('AddNewMaterial') }}:
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
                                          @filter="(val, done) => filterMaterials(val, RecipeType.DYE, done)"
                                          @update:model-value="onMaterialSelected"
                                        />
                                        <QBtn
                                          mt-2
                                          :label="t('Cancel')"
                                          icon="cancel"
                                          @click.stop="
                                            materialSelection = null;
                                            selectedMaterial = undefined;
                                          "
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              </QMarkupTable>
                            </div>

                            <div v-show="!materialSelection" class="flex flex-col justify-center">
                              <div
                                class="border-2 border-gray-300 rounded-full hover:border-primary hover:bg-primary-light transition-all duration-200 cursor-pointer group"
                              >
                                <QBtn
                                  round
                                  flat
                                  icon="add"
                                  class="transition-colors duration-200"
                                  @click="selectMaterial(program.stepNo, RecipeType.DYE, step.orderNo)"
                                >
                                  <QTooltip
                                    transition-show="scale"
                                    transition-hide="scale"
                                    :offset="[8, 0]"
                                    anchor="center right"
                                    self="center left"
                                  >
                                    {{ t('AddNewMaterial') }}
                                  </QTooltip>
                                </QBtn>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Salt Requests Section -->
                    <div v-if="program.saltRequests > 0">
                      <h4 class="flex-center text-xl my-2">
                        {{ t('programFields.SaltRequests') }}
                      </h4>
                      <div
                        v-for="(step, idx) in program.saltSteps"
                        :key="idx"
                        class="table-wrapper"
                        my-2
                      >
                        <div class="flex items-start">
                          <h3 class="step-header mr-4 mt-2 text-xl font-bold">
                            {{ step.orderNo }}
                          </h3>

                          <div class="flex gap-4 flex-nowrap">
                            <!-- fixed-width table -->
                            <div class="table-content">
                              <QMarkupTable
                                class="fixed-table"
                                overflow-hidden
                                dense
                                border-gray
                                bg-light-blue
                                border-rd-2
                                border-2
                              >
                                <thead>
                                  <tr :class="{ 'invisible-header': idx !== 0 }">
                                    <th class="text-left" w-10 />
                                    <th class="text-left" w-10>
                                      {{ t('materialFields.IsManual') }}
                                    </th>
                                    <th class="text-center" w-10>
                                      {{ t('materialFields.Code') }}
                                    </th>
                                    <th class="text-center" w-20>
                                      {{ t('materialFields.Name') }}
                                    </th>
                                    <th class="text-center" w-25>
                                      {{ t('recipeFields.Amount') }}
                                    </th>
                                    <th class="text-center" w-10>
                                      {{ t('recipeFields.Unit') }}
                                    </th>
                                  </tr>
                                </thead>
                                <draggable
                                  v-model="step.materials"
                                  item-key="materialCode"
                                  class="draggable-area"
                                  :group="{ name: 'materials', pull: false }"
                                  :sort="false"
                                  ghost-class="material-ghost"
                                  tag="tbody"
                                  @change="(e) => changeItem(program.saltSteps, e)"
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
                                          @click="onRemoveItem(step.materials, index)"
                                        />
                                      </td>
                                      <td w-10>
                                        {{ element.isManual ? t('Yes') : t('No') }}
                                      </td>
                                      <td w-10>
                                        <span>{{ element.materialCode }}</span>
                                      </td>
                                      <td
                                        w-20
                                        font-size-4
                                        font-900
                                      >
                                        <span>{{ element.materialName }}</span>
                                      </td>
                                      <td w-10>
                                        <QInput
                                          v-model.number="element.amount"
                                          dense
                                          type="number"
                                          :rules="[(v) => v >= 0]"
                                          min="0"
                                          hide-bottom-space
                                        />
                                      </td>
                                      <td w-10>
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
                                <tfoot
                                  v-show="materialSelection?.program === program.stepNo
                                    && materialSelection?.type === RecipeType.SALT
                                    && materialSelection?.step === step.orderNo
                                  "
                                >
                                  <tr>
                                    <td colspan="7">
                                      <div class="p-4" justify-center>
                                        {{ t('AddNewMaterial') }}:
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
                                          @filter="(val, done) => filterMaterials(val, RecipeType.SALT, done)"
                                          @update:model-value="onMaterialSelected"
                                        />
                                        <QBtn
                                          mt-2
                                          :label="t('Cancel')"
                                          icon="cancel"
                                          @click.stop="
                                            materialSelection = null;
                                            selectedMaterial = undefined;
                                          "
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              </QMarkupTable>
                            </div>

                            <div v-show="!materialSelection" class="flex flex-col justify-center">
                              <div
                                class="border-2 border-gray-300 rounded-full hover:border-primary hover:bg-primary-light transition-all duration-200 cursor-pointer group"
                              >
                                <QBtn
                                  round
                                  flat
                                  icon="add"
                                  class="transition-colors duration-200"
                                  @click="selectMaterial(program.stepNo, RecipeType.SALT, step.orderNo)"
                                >
                                  <QTooltip
                                    transition-show="scale"
                                    transition-hide="scale"
                                    :offset="[8, 0]"
                                    anchor="center right"
                                    self="center left"
                                  >
                                    {{ t('AddNewMaterial') }}
                                  </QTooltip>
                                </QBtn>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <QCard class="cursor-pointer program-card flex-center" @click="addProgram(editedPrograms!.length)">
                <QCardSection border-dashed>
                  <QIcon
                    v-show="programSelection !== editedPrograms?.length"
                    name="add"
                    size="2rem"
                  />
                  <div v-show="programSelection === editedPrograms?.length" justify-center>
                    {{ t('SelectProgram') }}:
                    <QSelect
                      v-model="selectedProgram"
                      borderless
                      clearable
                      dense
                      filled
                      use-input
                      input-debounce="0"
                      :option-label="getProgramName"
                      :options="programOptions"
                      @filter="filterPrograms"
                      @update:model-value="onProgramSelect"
                    />
                    <QBtn
                      mt-2
                      :label="t('Cancel')"
                      icon="cancel"
                      @click.stop="programSelection = null; selectedProgram = undefined;"
                    />
                  </div>
                </QCardSection>
              </QCard>
            </QList>
          </div>
        </div>
      </QCardSection>
      <div class="dialog-button-section z-20">
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
        <QBtn
          :label="t('Reset')"
          type="reset"
          icon="refresh"
          @click="onReset"
        />
        <QBtn
          :label="t('Delete')"
          color="negative"
          icon="delete"
          @click="onDelete"
        />
      </div>
    </QCard>
  </QDialog>
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
  cursor: pointer;
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

.no-hover:hover {
  z-index: initial;
  transform: none;
}

.material-table-container {
  position: sticky;
  top: 100px;
  right: 0px;
  width: 420px;
  height: 100%;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 10;
}

.material-rows {
  display: flex;
  flex-wrap: wrap;
}

.material-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 1px;
  margin: 5px;
  margin-left: 20px;
  position: relative;
  width: calc(50% - 40px);
  height: 40px;
}

.material-name-btn {
  flex: 2;
  overflow: hidden;
  font-size: 0.8rem;
  max-height: 40px;
  line-height: 1.2;
}

.material-amount,
.material-unit {
  flex: 1;
  margin-left: 10px;
}

.index-badge {
  position: absolute;
  top: 0;
  left: 0;
  padding: 4px 8px;
  background-color: #aaa;
  font-weight: bold;
  font-size: 0.9rem;
  color: #333;
}

.table-content {
  width: 700px;
  flex-shrink: 0;
}

:deep(.fixed-table .q-markup-table__overflow table) {
  width: 100% !important;
  table-layout: fixed !important;
  /* turn on fixed column sizing */
}

/* Column 1: narrow action/buttons column */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(1)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(1)) {
  width: 40px !important;
}

/* Column 2: “IsManual” */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(2)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(2)) {
  width: 60px !important;
}

/* Column 3: Code */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(3)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(3)) {
  width: 80px !important;
}

/* Column 4: Name  */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(4)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(4)) {
  width: 1fr !important;
  max-width: 200px !important;
}

/* Column 5 & 6: Amount and Unit */
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(5)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(5)),
:deep(.fixed-table .q-markup-table__overflow table th:nth-child(6)),
:deep(.fixed-table .q-markup-table__overflow table td:nth-child(6)) {
  width: 60px !important;
}

.table-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

:deep(.fixed-table .q-markup-table__overflow table th),
:deep(.fixed-table .q-markup-table__overflow table td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invisible-header {
  visibility: collapse !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}
</style>
