<script setup lang="ts">
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { ProgramHeader, RecipeMasterMaterial, RecipeMasterStep } from '~/shared/types'

const props = defineProps({
  recipeId: {
    type: Number,
    required: true,
  },
  recipeName: {
    type: String,
  },
  isNew: {
    type: Boolean,
  },
})

const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const q = useQuasar()

interface OptionMap {
  id: number
  name: string
}
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
const icons = [
  '',
  'science',
  'palette',
  'grain',
]

const recipeName = ref(props.recipeName)
const programs = ref<RecipeMasterStep[]>([])
const editedPrograms = ref<RecipeMasterStep[]>()

getPrograms()

async function getPrograms() {
  programs.value = await $fetch(`/api/recipes/master/steps/${props.recipeId}`)

  for (const program of programs.value) {
    let chemSteps = program.steps.filter(step => step.type === 1).length
    while (chemSteps < program.chemRequests) {
      program.steps.push({ type: 1, stepNo: chemSteps, materials: [] })
      chemSteps++
    }

    let dyeSteps = program.steps.filter(step => step.type === 2).length
    while (dyeSteps < program.dyeRequests) {
      program.steps.push({ type: 2, stepNo: dyeSteps, materials: [] })
      dyeSteps++
    }

    let saltSteps = program.steps.filter(step => step.type === 3).length
    while (saltSteps < program.saltRequests) {
      program.steps.push({ type: 3, stepNo: saltSteps, materials: [] })
      saltSteps++
    }
  }

  editedPrograms.value = klona(programs.value)
}

const hasChanges = computed(() => {
  return (
    recipeName.value !== props.recipeName
    || JSON.stringify(editedPrograms.value) !== JSON.stringify(programs.value)
  )
})
const table = ref()
const programSelection = ref<number | null>(null)
const programList = ref<ProgramHeader[]>([])
const programOptions = ref<ProgramHeader[]>([])
const selectedProgram = ref<ProgramHeader>()
const materialSelection = ref<{
  program: number
  step: number
  parallel: number
} | null>(null)
const selectedCard = ref<number[]>([-1, -1])

async function addProgram(index: number) {
  if (programList.value.length === 0)
    await getProgramList()
  programSelection.value = index
}
function removeProgram(index: number) {
  editedPrograms.value?.splice(index, 1)
}
async function getProgramList() {
  programList.value = await $fetch(`/api/programs/headers/3`)
  programOptions.value = programList.value
}
async function onProgramSelect(program: ProgramHeader | undefined) {
  if (program) {
    const recipeStep: RecipeMasterStep = { recipeId: props.recipeId, stepNo: programs.value.length, steps: [], ...program }
    for (let i = 0; i < program.chemRequests; i++)
      recipeStep.steps.push({ type: 1, stepNo: i, materials: [] })
    for (let i = 0; i < program.dyeRequests; i++)
      recipeStep.steps.push({ type: 2, stepNo: i, materials: [] })
    for (let i = 0; i < program.saltRequests; i++)
      recipeStep.steps.push({ type: 3, stepNo: i, materials: [] })
    if (programSelection.value === editedPrograms.value?.length)
      editedPrograms.value?.push(recipeStep)
    else
      editedPrograms.value![programSelection.value!] = recipeStep
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
function addMaterial(program: number, step: number) {
  selectMaterial(program, step, editedPrograms.value!.at(program)!.steps.at(step)!.materials.length)
  selectedCard.value = [program, step]
}

function selectMaterial(program: number, step: number, parallel: number, unselect: boolean = false) {
  if (unselect && materialSelection.value && program === materialSelection.value.program && materialSelection.value.step === step && materialSelection.value.parallel === parallel) {
    materialSelection.value = null
  } else {
    materialSelection.value = { program, step, parallel }
    table.value.type = editedPrograms.value!.at(program)?.steps.at(step)?.type
    selectCard(program, step, false)
  }
}

function removeMaterial(programIndex: number, stepIndex: number, materialIndex: number) {
  editedPrograms.value![programIndex].steps[stepIndex].materials.splice(materialIndex, 1)
  materialSelection.value = null
}

function onMaterialSelected(material: RecipeMasterMaterial) {
  const { program, step, parallel } = materialSelection.value!

  const stepMaterials = editedPrograms.value!.at(program)?.steps.at(step)!.materials

  if (!stepMaterials) {
    console.error('Invalid program or step selection')
    return
  }

  if (parallel >= stepMaterials.length) {
    stepMaterials.push(material)
  } else {
    material.unit = stepMaterials[parallel].unit
    material.amount = stepMaterials[parallel].amount
    stepMaterials[parallel] = material
  }
  materialSelection.value = null
}

function selectCard(program: number, step: number, unselect: boolean = true) {
  if (unselect && isCardSelected(program, step))
    selectedCard.value = [-1, -1]
  else
    selectedCard.value = [program, step]
  if (materialSelection.value?.program !== program || materialSelection.value?.step !== step) {
    materialSelection.value = null
  }
}

function isCardSelected(program: number, stepIndex: number): boolean {
  return program === selectedCard.value[0] && stepIndex === selectedCard.value[1]
}

function getSmallCardStyle(idx: number, total: number) {
  const maxStackHeight = 400
  const maxStackWidth = 800
  const cardHeight = 200
  const cardWidth = 650

  /*
  cardWidth + (total-1)*margin = maxCardStackWidth
  margin = (maxCardStackWidth-cardWidth)/(total-1)
  translateX = idx * margin = idx*(maxCardStackWidth-cardWidth)/(total-1)
  */
  const translateX = idx * ((maxStackWidth - cardWidth) / (total - 1))
  /*
  cardHeight*idx -> margin*idx
  translateY = idx*(margin-cardHeight)
  cardHeight + (total-1)*margin = maxStackHeight
  margin = (maxStackHeight-cardHeight)/(total-1)
  translateY = idx*[(maxStackHeight-cardHeight)/(total-1)-cardHeight]
  */
  const translateY = idx * ((maxStackHeight - cardHeight) / (total - 1) - cardHeight)

  return {
    transform: `translate(${translateX}px, ${translateY}px)`,
  }
}

async function onSave() {
  if (hasChanges.value) {
    if (props.isNew)
      await $fetch(`/api/recipes/master/${props.recipeId}`, { method: 'PUT', body: { recipe: { recipeId: props.recipeId, recipeName: props.recipeName } } })
    await $fetch(`/api/recipes/master/${props.recipeId}`, { method: 'POST', body: { recipeName: recipeName.value, steps: editedPrograms.value } })
    onDialogOK(true)
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
      materialSelection.value = null
      selectCard(-1, -1)
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
    await $fetch(`/api/recipes/master/${props.recipeId}`, { method: 'DELETE' })
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
      <div class="pt-5">
        <QInput
          v-model="recipeName"
          input-class="text-center text-xl"
          dense
        />
      </div>
      <QCardSection>
        <div class="row">
          <div w-320>
            <QList bordered class="q-pa-md">
              <div
                v-for="(program, programIndex) in editedPrograms"
                :key="programIndex"
                class="q-mb-md large-card-container"
              >
                <div class="large-card-wrapper">
                  <QCard
                    class="large-card"
                    flex-center
                    @click="addProgram(programIndex)"
                  >
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
                      <p><strong>{{ t('ChemRequests') }}:</strong> {{ program.chemRequests }}</p>
                      <p><strong>{{ t('DyeRequests') }}:</strong> {{ program.dyeRequests }}</p>
                      <p><strong>{{ t('SaltRequests') }}:</strong> {{ program.saltRequests }}</p>
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
                  <div class="small-cards-stack">
                    <div
                      v-for="(step, stepIndex) in program.steps"
                      :key="stepIndex"
                      class="small-card-container"
                      :class="[{ 'no-hover': selectedCard[0] !== -1 && !isCardSelected(programIndex, stepIndex), 'selected': isCardSelected(programIndex, stepIndex) }]"
                      :style="getSmallCardStyle(stepIndex, program.steps.length)"
                      @click="selectCard(programIndex, stepIndex)"
                    >
                      <QCard
                        class="small-card"
                        :style="{
                          backgroundColor: isCardSelected(programIndex, stepIndex)
                            ? '#FFBF00'
                            : stepIndex % 2 !== 0
                              ? '#818181'
                              : '',
                        }"
                      >
                        <QCardSection pl-0 pr-1>
                          <div right-0 top-0>
                            <QIcon
                              :name="icons[step.type]"
                              size="14px"
                              class="absolute top-0 left-0"
                            />
                            <QBtn
                              icon="add"
                              flat
                              round
                              size="13px"
                              class="absolute top-0 right-0"
                              @click.stop="addMaterial(programIndex, stepIndex)"
                            />
                          </div>
                          <div class="material-rows">
                            <div
                              v-for="(material, materialIndex) in step.materials"
                              :key="materialIndex"
                              class="material-row"
                              :class="[{ 'selected-material': materialSelection?.parallel === materialIndex && materialSelection?.program === programIndex && materialSelection?.step === stepIndex }]"
                            >
                              <QBtn
                                icon="remove"
                                flat
                                round
                                dense
                                size="10px"
                                @click.stop="removeMaterial(programIndex, stepIndex, materialIndex)"
                              />
                              <QBtn
                                flat
                                no-wrap
                                align="left"
                                class="material-name-btn"
                                @click.stop="selectMaterial(programIndex, stepIndex, materialIndex, true)"
                              >
                                <QTooltip
                                  v-if="material.materialName.length > 10"
                                  anchor="top middle"
                                  :offset="[30, 30]"
                                >
                                  {{ material.materialName }}
                                </QTooltip>
                                <div class="ellipsis">
                                  {{ material.materialName }}
                                </div>
                              </QBtn>
                              <div
                                class="material-amount"
                                @click.stop="selectCard(programIndex, stepIndex, false) "
                              >
                                <QInput
                                  v-model="material.amount"
                                  type="number"
                                  dense
                                  :rules="[(val: number) => val >= 0]"
                                  min="0"
                                  hide-bottom-space
                                />
                              </div>
                              <div
                                class="material-unit"
                                @click.stop="selectCard(programIndex, stepIndex, false)"
                              >
                                <QSelect
                                  v-model="material.unit"
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
                              </div>
                            </div>
                          </div>
                        </QCardSection>
                      </QCard>
                      <QCardSection class="small-card-index">
                        {{ stepIndex + 1 }}
                      </QCardSection>
                    </div>
                  </div>
                </div>
              </div>
              <QCard class="cursor-pointer large-card flex-center" @click="addProgram(editedPrograms!.length)">
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
          <div
            v-show="materialSelection"
            class="material-table-container"
            pl-10
          >
            <MaterialTable
              ref="table"
              @material-selected="onMaterialSelected"
              @close="materialSelection = null"
            />
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
.large-card {
  height: 400px;
  width: 400px;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
  cursor: pointer;
}

.large-card:hover {
  background-color: rgba(120, 120, 120, 0.5);
  cursor: pointer;
  transform: scale(1.02);
}

.large-card-container {
  display: flex;
  align-items: flex-start;
}

.large-card-wrapper {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.small-card {
  width: 650px;
  height: 200px;
  position: relative;
  overflow: auto;
  padding: 10px;
  box-sizing: border-box;
}

.small-cards-stack {
  flex-direction: column;
  margin-left: 20px;
  max-height: 400px;
  max-width: 800px;
}

.small-card-container {
  position: relative;
  transition:
    transform 0.3s,
    z-index 0.3s;
}

.small-card-container:hover {
  z-index: 10;
  transform: scale(1.1);
}

.small-card-container.selected {
  z-index: 10;
  transform: scale(1.1);
  pointer-events: none;
}
.small-card-container.selected * {
  pointer-events: auto;
}

.no-hover:hover {
  z-index: initial;
  transform: none;
}

.small-card::-webkit-scrollbar {
  width: 8px;
}

.small-card::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}

.small-card::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
.material-table-container {
  position: sticky;
  top: 100px;
  right: 0px;
  height: 100%;
  width: 420px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 100;
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

.small-card-index {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 2px 4px;
  border: 1px solid;
  border-left: none;
  border-bottom: none;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}
.selected-material {
  background-color: grey;
}
</style>
