<script setup lang="ts">
defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-120">
      <q-card-section class="row items-center">
        <span class="text-4"> {{ t('discardChanges.title') }}</span>
        <q-space />
        <q-btn
          v-close-popup
          round
          flat
          size="sm"
          dense
          icon="close"
          class="text-gray-4 dark:text-gray-6"
          @click="onDialogCancel"
        />
      </q-card-section>
      <q-card-section>
        {{ t('discardChanges.message') }}
      </q-card-section>
      <q-card-actions align="right" class="bg-gray-1 dark:bg-dark-4">
        <q-btn
          v-close-popup
          class=" bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('discardChanges.cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          class=" bg-red text-white"
          :label="t('discardChanges.discard')"
          flat
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
