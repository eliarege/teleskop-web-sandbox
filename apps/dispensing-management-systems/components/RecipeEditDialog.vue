<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import ConfirmationDialog from './ConfirmationDialog.vue'
import type { Material, RecipeMaster } from '~/shared/types'

const props = defineProps({
  recipeNo: {
    type: Number,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { data: recipe } = useFetch<RecipeMaster>(`/api/recipes/master/${props.recipeNo}`)
const { data: materials } = useFetch<Material[]>('/api/materials')
const recipeSteps = ref<Material[]>([{ materialCode: 'ABC', materialName: 'ABC KİMYASALI' }, { materialCode: 'XYZ', materialName: 'XYZ BOYASI' }])

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
  const newItem = { ...event.item }
  recipeSteps.value.push(newItem)
}

function onRemove(event: any) {
  const index = recipeSteps.value.indexOf(event.item)
  if (index > -1) {
    recipeSteps.value.splice(index, 1)
  }
}

function onMoveFromMaterials(event: any) {
  if (event.to === event.from) {
    return false
  }
  return true
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <div class="row">
        <div class="col-3">
          <h3>{{ t('Recipe') }}</h3>
          <draggable
            v-model="recipeSteps"
            class="draggable"
            group="materials"
            item-key="materialCode"
            ghost-class="ghost"
            @change="log"
            @remove="onRemove"
          >
            <template #item="{ element, index }">
              <div class="list-group-item">
                {{ index }} - {{ element.materialName }}
              </div>
            </template>
          </draggable>
        </div>

        <div class="col-3">
          <h3>{{ t('Materials') }}</h3>
          <draggable
            v-model="materials"
            class="draggable"
            item-key="materialCode"
            ghost-class="ghost"
            :group="{ name: 'materials', pull: 'clone', put: false }"
            :clone="(item: any) => ({ ...item })"
            :move="onMoveFromMaterials"
            @change="log"
            @add="onAdd"
          >
            <template #item="{ element, index }">
              <div class="list-group-item">
                {{ index }} - {{ element.materialName }}
              </div>
            </template>
          </draggable>
        </div>

        <rawDisplayer
          class="col-3"
          :value="recipeSteps"
          title="List 1"
        />

        <rawDisplayer
          class="col-3"
          :value="materials"
          title="List 2"
        />
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
.buttons {
  margin-top: 35px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.draggable {
  cursor: pointer;
}
.not-draggable {
  cursor: no-drop;
}
</style>
