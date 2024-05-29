<script setup lang="ts">
import type { ProcessType } from '~/shared/types'

defineEmits([
  ...useDialogPluginComponent.emits,
])
const processType = ref({
  value: 1,
  label: '',
  description: '',
} as ProcessType)
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    class="wider-dialog"
  >
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('create') }}</span>
      </q-card-section>
      <q-card-section>
        <div class="flex gap-5">
          <q-input
            v-model="processType.value"
            :label="t('changeProcessTypeDialog.processTypeNo')"
            dense
            outlined
          />
          <q-input
            v-model="processType.label"
            :label="t('changeProcessTypeDialog.processTypeName')"
            dense
            outlined
          />
          <q-input
            v-model="processType.description"
            :label="t('changeProcessTypeDialog.note')"
            dense
            outlined
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          outline
          icon="check"
          :label="t('create')"
          :disable="!processType.value"
          @click="onDialogOK(processType)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.wider-dialog .q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
