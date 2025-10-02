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

// Reactive form data
const processType = ref<ProcessType>({
  value: props.processType?.value ?? 0,
  label: props.processType?.label ?? '',
  description: props.processType?.description ?? '',
})

const formRef = ref()

// Computed properties for cleaner template
const isEditMode = computed(() => !!props.processType)
const dialogTitle = computed(() =>
  isEditMode.value
    ? t('processTypeDialog.editProcessType.title')
    : t('processTypeDialog.createProcessType.title'),
)

// Validation rules
const valueRules = computed(() => [
  (val: number) => (val >= 0) || t('processTypeDialog.createProcessType.processTypeNoRequired'),
  (val: number) => isEditMode.value || !editor.allProcessTypes.find(type => type.value === val)
  || t('processTypeDialog.createProcessType.processTypeNoUnique'),
])

const labelRules = [
  (val: string) => (val && val.trim().length > 0) || t('processTypeDialog.createProcessType.processTypeNameRequired'),
]

async function handleApply() {
  const isValid = await formRef.value?.validate()
  if (isValid) {
    onDialogOK(processType.value)
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ dialogTitle }}
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
        <q-form ref="formRef">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="processType.value"
                :label="t('processTypeDialog.processTypeNo')"
                type="number"
                min="0"
                :rules="valueRules"
                :readonly="isEditMode"
                :hint="isEditMode ? t('processTypeDialog.createProcessType.processTypeNoReadOnlyHint') : ''"
                dense
                outlined
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="processType.label"
                :label="t('processTypeDialog.createProcessType.processTypeName')"
                :rules="labelRules"
                dense
                outlined
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="processType.description"
                :label="t('processTypeDialog.createProcessType.note')"
                dense
                outlined
              />
            </div>
          </div>
        </q-form>
      </QCardSection>

      <QCardActions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <QBtn
          :label="t('cancel')"
          color="grey-7"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('apply')"
          color="primary"
          unelevated
          @click="handleApply"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
