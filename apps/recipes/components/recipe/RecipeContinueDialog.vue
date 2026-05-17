<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { OptionMap, RecipeProgramMaster, RecipeProgramMasterStep } from '~/shared/types'
import { getRecipeTypeOptions, getUnitOptions } from '~/shared/enums'
import { RecipeType } from '~/shared/constants'

const props = defineProps({
  recipeId: {
    type: Number,
    required: true,
  },
  isNew: {
    type: Boolean,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])
const recipe = ref<RecipeProgramMaster>()
const editedRecipe = ref<RecipeProgramMaster>()
const defaultRecipe: RecipeProgramMaster = {
  recipeId: props.recipeId,
  recipeName: '',
  recipeGroup: 0,
  recipeType: 0,
  comment: '',
  stepNo: 0,
  programNo: 0,
  isPassive: false,
  prepTime: new Date(),
  lastUpdate: new Date(),
}
const defaultSteps = ref<RecipeProgramMasterStep[]>([])
const recipeSteps = ref<RecipeProgramMasterStep[]>([])
const units = getUnitOptions(t)
const types = getRecipeTypeOptions(t)
const groups: OptionMap[] = []
const table = ref()
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedRecipe.value) !== JSON.stringify(props.isNew ? defaultRecipe : recipe.value)
    || JSON.stringify(recipeSteps.value) !== JSON.stringify(defaultSteps.value)
  )
})
getRecipe()
getRecipeSteps()
async function getRecipe() {
  if (!props.isNew) {
    recipe.value = await $fetch(`/api/recipes/master/continue/${props.recipeId}`)
    editedRecipe.value = klona(recipe.value)
  } else {
    editedRecipe.value = klona(defaultRecipe)
  }
}
async function getRecipeSteps() {
  recipeSteps.value = await $fetch(`/api/recipes/master/continue/steps/${props.recipeId}`)
  defaultSteps.value = recipeSteps.value
}
async function onSave() {
  try {
    if (props.isNew) {
      await $fetch(`/api/recipes/master/continue`, { method: 'PUT', body: { recipe: editedRecipe.value } })
    } else {
      await $fetch(`/api/recipes/master/continue/${props.recipeId}`, { method: 'POST', body: { recipe: editedRecipe.value } })
    }
    await $fetch(`/api/recipes/master/continue/steps/${props.recipeId}`, { method: 'POST', body: { steps: recipeSteps.value } })
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
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
  if (hasChanges.value) {
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
      recipeSteps.value = defaultSteps.value
      editedRecipe.value = klona(props.isNew ? defaultRecipe : recipe.value)
    })
  }
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
    await $fetch(`/api/recipes/master/continue/${props.recipeId}`, { method: 'DELETE' })
    onDialogOK(true)
  })
}

function log(e: any) {
  console.log(e)
}
function onAdd(event: any) {
  const item = event.item._underlying_vm_
  item.recipeId = props.recipeId
  const index = event.newDraggableIndex
  const mainStep = index > 0 ? recipeSteps.value.at(index - 1)?.mainStep : 1
  item.mainStep = mainStep
  item.parallelStep = index > 0 ? recipeSteps.value.at(index - 1)!.parallelStep + 1 : 1
  let i = index + 1
  while (i < recipeSteps.value.length && recipeSteps.value.at(i)?.mainStep === mainStep) {
    recipeSteps.value.at(i)!.parallelStep = recipeSteps.value.at(i)!.parallelStep + 1
    i++
  }
  recipeSteps.value = [...recipeSteps.value]
}
function onRemove(event: any) {
  const index = recipeSteps.value.indexOf(event.item)
  if (index > -1) {
    recipeSteps.value.splice(index, 1)
  }
}
function moveItem(from: number, to: number) {
  const item = recipeSteps.value.at(from)!;
  [item.mainStep, recipeSteps.value[to].mainStep] = [recipeSteps.value[to].mainStep, item.mainStep];
  [item.parallelStep, recipeSteps.value[to].parallelStep] = [recipeSteps.value[to].parallelStep, item.parallelStep]
  recipeSteps.value.splice(from, 1)
  recipeSteps.value.splice(to, 0, item)
}
function updateStep(index: number, isMain: boolean, refs: any) {
  const element = recipeSteps.value.splice(index, 1)[0]

  let newIndex = recipeSteps.value.findIndex(
    item =>
      item.mainStep > element.mainStep
      || (item.mainStep === element.mainStep && item.parallelStep > element.parallelStep),
  )
  if (newIndex === -1) {
    recipeSteps.value.push(element)
    newIndex = recipeSteps.value.length - 1
  } else {
    recipeSteps.value.splice(newIndex, 0, element)
  }
  const refName = isMain ? `mainStep${newIndex}` : `parallelStep${newIndex}`
  const inputRef = refs[refName] as HTMLInputElement
  if (inputRef) {
    inputRef.focus()
  }
}

function onRemoveStep(index: number) {
  recipeSteps.value.splice(index, 1)
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    :persistent="hasChanges"
    @hide="onDialogHide"
  >
    <QCard>
      <div v-if="editedRecipe" class="flex flex-row flex-wrap justify-center">
        <div class="row-item">
          <span class="item-label">
            {{ t('recipeFields.ID') }}
          </span>
          <QInput
            v-model="editedRecipe.recipeId"
            class="item-input"
            dense
            type="text"
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
        <div class="row-item">
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
      <div class="row justify-center">
        <div class="col-7 mr-2">
          <h3 flex-center>
            {{ t('Recipe') }}
          </h3>
          <QMarkupTable>
            <thead>
              <tr>
                <th class="text-left" />
                <th class="text-left" />
                <th class="text-left">
                  {{ t('recipeFields.MainStep') }}
                </th>
                <th class="text-center">
                  {{ t('recipeFields.ParallelStep') }}
                </th>
                <th class="text-center">
                  {{ t('materialFields.Code') }}
                </th>
                <th class="text-center">
                  {{ t('materialFields.Name') }}
                </th>
                <th class="text-center">
                  {{ t('recipeFields.Amount') }}
                </th>
                <th class="text-center">
                  {{ t('recipeFields.Unit') }}
                </th>
              </tr>
            </thead>
            <draggable
              v-model="recipeSteps"
              class="draggable-area"
              group="materials"
              ghost-class="material-ghost"
              tag="tbody"
              @change="log"
              @add="onAdd"
              @remove="onRemove"
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
                      @click="onRemoveStep(index)"
                    />
                  </td>
                  <td important-p-0>
                    <div class="column">
                      <QBtn
                        icon="keyboard_arrow_up"
                        :disabled="index === 0"
                        flat
                        p-0
                        @click="moveItem(index - 1, index)"
                      />
                      <QBtn
                        icon="keyboard_arrow_down"
                        :disabled="index === recipeSteps.length - 1"
                        flat
                        p-0
                        @click="moveItem(index, index + 1)"
                      />
                    </div>
                  </td>
                  <td>
                    <QInput
                      :ref="`mainStep${index}`"
                      v-model.number="element.mainStep"
                      dense
                      type="number"
                      reactive-rules
                      :rules="[
                        (val: number) => val >= 0,
                        (val: number) => !recipeSteps.some((e, i) => e.mainStep === val && e.parallelStep === element.parallelStep && i !== index),
                      ]"
                      min="1"
                      hide-bottom-space
                      @update:model-value="val => updateStep(index, true, $refs)"
                    />
                  </td>
                  <td>
                    <QInput
                      :ref="`parallelStep${index}`"
                      v-model.number="element.parallelStep"
                      dense
                      type="number"
                      reactive-rules
                      :rules="[
                        (val: number) => val >= 0,
                        (val: number) => !recipeSteps.some((e, i) => e.parallelStep === val && e.mainStep === element.mainStep && i !== index),
                      ]"
                      min="1"
                      hide-bottom-space
                      @update:model-value="val => updateStep(index, false, $refs)"
                    />
                  </td>

                  <td>
                    <span>
                      {{ element.materialCode }}
                    </span>
                  </td>
                  <td>
                    <span>
                      {{ element.materialName }}
                    </span>
                  </td>
                  <td>
                    <QInput
                      v-model="element.amount"
                      dense
                      type="number"
                      :rules="[(val: number) => val >= 0]"
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
        <div class="col-4">
          <h3 flex-center>
            {{ t('Materials') }}
          </h3>
          <MaterialTable
            ref="table"
            :is-draggable="true"
            :type="RecipeType.MATERIALS"
            :show-type-filter="false"
            ml-2
          />
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
        <QBtn
          :label="t('Reset')"
          type="reset"
          icon="refresh"
          @click="onReset"
        />
        <QBtn
          v-if="!isNew"
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
.row-item {
  margin: 0.75rem;
  width: 40rem;
}
.buttons {
  margin-top: 35px;
}
</style>
