<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  count: number
}>()

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    persistent
    @hide="onDialogHide"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('findAndReplace.replaceConfirm') }}
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
          {{ t('findAndReplace.replaceConfirmMessage', { count: props.count }) }}
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
          :label="t('replace')"
          class="q-mr-sm bg-primary text-white"
          flat
          @click="onDialogOK"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
