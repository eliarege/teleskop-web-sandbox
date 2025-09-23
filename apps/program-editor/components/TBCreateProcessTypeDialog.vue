<script setup lang="ts">
import type { ProcessType } from '~/shared/types'

const props = defineProps<{
  processType?: ProcessType
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const editor = useEditorStore()

const processType = ref<ProcessType>({
  value: props.processType?.value ?? null!,
  label: props.processType?.label ?? '',
  description: props.processType?.description ?? '',
})

const isFormValid = computed(() => {
  return processType.value.value >= 0
    && processType.value.label.trim().length > 0
    && (!props.processType ? !editor.allProcessTypes.find(type => type.value === processType.value.value) : true)
})
</script>

<template>
  <QDialog
    ref="dialogRef"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ props.processType ? t('processTypeDialog.editProcessType.title') : t('processTypeDialog.createProcessType.title') }}
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
            v-model.number="processType.value"
            :label="t('processTypeDialog.processTypeNo')"
            type="number"
            min="0"
            :rules="[val => val >= 0
              || t('processTypeDialog.createProcessType.processTypeNoRequired'), val => !(!props.processType && editor.allProcessTypes.find(type => type.value === val))
              || t('processTypeDialog.createProcessType.processTypeNoUnique')]"
            :readonly="!!props.processType"
            :hint="props.processType ? t('processTypeDialog.createProcessType.processTypeNoReadOnlyHint') : ''"
            dense
            outlined
          />
          <q-input
            v-model="processType.label"
            :label="t('processTypeDialog.createProcessType.processTypeName')"
            dense
            outlined
          />
          <q-input
            v-model="processType.description"
            :label="t('processTypeDialog.createProcessType.note')"
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
          :label="t('apply')"
          class="q-mr-sm bg-primary text-white"
          flat
          :disable="!isFormValid"
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
