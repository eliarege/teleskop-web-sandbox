<script setup lang="ts">
const props = defineProps({
  options: Array<{ label: string, value: number }>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const selectedOption = ref(0)
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.deleteProgramDialog.warning', { name: props.programName }) }}</span>
      </q-card-section>
      <q-card-section>
        <div class="flex items-center justify-center">
          <q-option-group
            v-model="selectedOption"
            :options="props.options"
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
          :label="t('change')"
          @click="onDialogOK(selectedOption)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
