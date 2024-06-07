<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import draggable from "vuedraggable";
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
const enabled = ref(true)
const dragging = ref(false)
function checkMove(element: any) {
  console.log(`Future index: ${element.draggedContext.futureIndex}`)
}
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
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <div class="row">
        <div class="col-6 flex-center">
          <draggable
            :list="materials"
            :disabled="!enabled"
            item-key="name"
            class="list-group"
            ghost-class="ghost"
            :move="checkMove"
            @start="dragging = true"
            @end="dragging = false"
          >
            <template #item="{ element }">
              <div class="list-group-item" :class="{ 'not-draggable': !enabled }">
                {{ element.materialName }}
              </div>
            </template>
          </draggable>
        </div>

        <rawDisplayer
          class="col-3"
          :value="materials"
          :title="t('Materials')"
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
          v-if="recipe"
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

.not-draggable {
  cursor: no-drop;
}
</style>
