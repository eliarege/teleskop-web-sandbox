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
const { dark } = useQuasar()
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
        class="q-pa-md"
        :class="dark.isActive ? 'bg-dark-4' : 'bg-gray-1'"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('create')"
          class="q-mr-sm bg-primary text-white"
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
