<script setup lang="ts">
import { ADDITIONAL_PROCESS_CODE_ILAVE } from '~/shared/constants'

const props = defineProps<{
  typeId: number
  additionalTypeId?: number
  options: { label: string, value: number }[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const selectedOption = ref(
  props.typeId || props.options[0]?.value || 0,
)
const selectedAdditionalOption = ref(
  props.additionalTypeId || props.options[0]?.value || 0,
)
const isIlaveSelected = computed(() => selectedOption.value === ADDITIONAL_PROCESS_CODE_ILAVE)
const additionalOptions = computed(() => props.options.filter(option => option.value !== ADDITIONAL_PROCESS_CODE_ILAVE))
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card style="width: 500px" class="select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('contextMenu.processTypeDialog.title') }}
          <q-space />
          <q-btn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.processTypeDialog.warning') }}</span>
      </q-card-section>

      <q-card-section>
        <div class="flex flex-col items-center justify-center gap-4">
          <q-select
            v-model="selectedOption"
            :options="options"
            :label="t('program.processType')"
            class="w-1/2"
            map-options
            emit-value
            options-dense
            outlined
            dense
          />
          <q-select
            v-if="isIlaveSelected"
            v-model="selectedAdditionalOption"
            :options="additionalOptions"
            :label="t('program.additionalType')"
            class="w-1/2"
            map-options
            emit-value
            options-dense
            outlined
            dense
          />
        </div>
      </q-card-section>

      <q-card-actions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('apply')"
          class="q-mr-sm bg-primary text-white"
          flat
          @click="onDialogOK({
            typeId: selectedOption,
            additionalTypeId: isIlaveSelected ? selectedAdditionalOption : null,
          })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
