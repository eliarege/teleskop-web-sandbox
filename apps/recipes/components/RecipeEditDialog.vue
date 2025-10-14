<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import ConfirmationDialog from './ConfirmationDialog.vue'
import type { RecipeMaster } from '~/shared/types'

const props = defineProps({
  recipeNo: {
    type: Number,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { data: recipe } = useFetch<RecipeMaster>(`/api/recipes/master/${props.recipeNo}`)
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
