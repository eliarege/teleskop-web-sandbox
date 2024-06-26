<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import ConfirmationDialog from './ConfirmationDialog.vue'
import type { BatchRecipeStep, RecipeMaster } from '~/shared/types'

const props = defineProps({
  recipeNo: {
    type: Number,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { data: recipe } = useFetch<RecipeMaster>(`/api/recipes/master/${props.recipeNo}`)
const recipeSteps = ref<BatchRecipeStep[]>([{ materialCode: 'ABC', materialName: 'ABC KİMYASALI', mainStep: 1, parallelStep: 1, amount: 1.5000, unit: 3 }, { materialCode: 'XYZ', materialName: 'XYZ BOYASI', mainStep: 2, parallelStep: 1, amount: 2.5000, unit: 3 }])
const units = [{ id: 0, name: t('units.0') }, { id: 1, name: t('units.1') }, { id: 2, name: t('units.2') }, { id: 3, name: t('units.3') }, { id: 4, name: t('units.4') }, { id: 5, name: t('units.5') }, { id: 6, name: t('units.6') }]
async function onSave() {

}

function onReset() {

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
    await $fetch(`/api/recipes/master/${props.recipeNo}`, { method: 'DELETE', body: { recipeNo: recipe.value?.recipeId } })
    onDialogOK(null)
  })
}

function log(e: any) {
  console.log(e)
}
function onAdd(event: any) {
  const item = event.item._underlying_vm_
  const index = event.newDraggableIndex
  const mainStep = index > 0 ? recipeSteps.value.at(index - 1)?.mainStep : 1
  item.mainStep = mainStep
  item.parallelStep = index > 0 ? recipeSteps.value.at(index - 1)?.parallelStep + 1 : 1
  recipeSteps.value = [...recipeSteps.value]
  let i = index + 1
  while (i < recipeSteps.value.length && recipeSteps.value.at(i)?.mainStep === mainStep) {
    recipeSteps.value.at(i).parallelStep = recipeSteps.value.at(i).parallelStep + 1
    i++
  }
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
function onRemoveStep(index: number) {
  recipeSteps.value.splice(index, 1)
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
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
                  <td class="no-padding">
                    <QBtn
                        icon="close"
                        flat
                        @click="onRemoveStep(index)"
                        pl-2
                        pr-0
                        op-70
                        size="sm"
                      />
                  </td>
                  <td class="no-padding">
                    <div class="column">
                      <QBtn
                        icon="keyboard_arrow_up"
                        :disabled="index === 0"
                        flat
                        @click="moveItem(index - 1, index)"
                        p-0
                      />
                      <QBtn
                        icon="keyboard_arrow_down"
                        :disabled="index === recipeSteps.length - 1"
                        flat
                        @click="moveItem(index, index + 1)"
                        p-0
                      />
                    </div>
                  </td>
                  <td>
                    <QInput
                      v-model="element.mainStep"
                      dense
                      type="number"
                      :rules="[(val: number) => val >= 0]"
                      min="1"
                      hide-bottom-space
                    />
                  </td>
                  <td>
                    <QInput
                      v-model="element.parallelStep"
                      dense
                      type="number"
                      :rules="[(val: number) => val >= 0]"
                      min="1"
                      hide-bottom-space
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
          <MaterialTable ml-2 />
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
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('Reset')"
          type="reset"
          icon="refresh"
          @click="onReset"
        />
        <QBtn
          v-if="recipeNo"
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

.no-padding {
  padding: 0 !important;
}
.buttons {
  margin-top: 35px;
}
</style>
