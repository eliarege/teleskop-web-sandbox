<script setup lang="ts">
import type { ProcessType } from '~/shared/types'

const props = defineProps<{
  processType: ProcessType
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <QDialog
    ref="dialogRef"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('processTypeDialog.deleteProcessType.title') }}
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
        <div>
          {{ t('processTypeDialog.deleteProcessType.deletionWarning', { type: props.processType.label }) }}
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
          :label="t('delete')"
          class="q-mr-sm bg-red text-white"
          flat
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
