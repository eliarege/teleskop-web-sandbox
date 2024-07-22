<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  programNames: Array,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const selectedOption = ref('db-machine')
const options = [
  { label: t('contextMenu.deleteProgramDialog.deleteFromBoth'), value: 'db-machine' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromTeleskop'), value: 'db' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromMachine'), value: 'machine' },
]
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar
          icon="delete"
        />
        <span class="q-ml-sm max-w-100"> {{ t('contextMenu.deleteProgramDialog.warning', { name: props.programNames }) }}</span>
      </q-card-section>
      <q-card-section>
        <div class="flex items-center justify-center">
          <q-option-group
            v-model="selectedOption"
            :options="options"
            dense
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('delete')"
          color="red"
          icon="delete"
          @click="onDialogOK(selectedOption)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
