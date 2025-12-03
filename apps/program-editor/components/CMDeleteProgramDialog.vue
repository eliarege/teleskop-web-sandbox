<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const props = defineProps<{
  programNos: number[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const { t } = useI18n()
const selectedOption = ref('db-machine')
const options = [
  { label: t('contextMenu.deleteProgramDialog.deleteFromBoth'), value: 'db-machine' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromTeleskop'), value: 'db' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromMachine'), value: 'machine' },
]
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard style="width: 500px" class="select-none">
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('contextMenu.deleteProgramDialog.title') }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <QCardSection class="text-gray-8 dark:text-gray-3">
        <span class="max-w-100">
          {{ t('contextMenu.deleteProgramDialog.message', { count: programNos.length, programNo: props.programNos.join(', ') }) }}
        </span>
        <div class="mt-4 ml-4 flex">
          <QOptionGroup
            v-model="selectedOption"
            class="q-gutter-sm"
            :options="options"
            dense
          />
        </div>
      </QCardSection>

      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('delete')"
          class="q-mr-sm bg-red-6 text-white"
          flat
          @click="onDialogOK(selectedOption)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
