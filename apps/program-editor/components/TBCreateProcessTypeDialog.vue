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
  <QDialog
    ref="dialogRef"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('changeProcessTypeDialog.createProcessType._') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>
      <QCardSection>
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
      </QCardSection>

      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('create')"
          class="q-mr-sm bg-primary text-white dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          :disable="!processType.value"
          @click="onDialogOK(processType)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style scoped>
.q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
