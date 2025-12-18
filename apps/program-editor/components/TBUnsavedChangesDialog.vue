<script setup lang="ts">
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-120 select-none">
      <q-card-section class="text-h6 flex">
        {{ t('unsavedChanges.title') }}
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="text-gray-4 dark:text-gray-6"
          round
          flat
          dense
          @click="onDialogCancel"
        />
      </q-card-section>
      <q-card-section class="pt-0">
        {{ t('unsavedChanges.message') }}
      </q-card-section>
      <q-card-actions align="right" class="bg-gray-1 dark:bg-dark-4">
        <q-btn
          v-close-popup
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('unsavedChanges.buttons.cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          class=" bg-red text-white"
          :label="t('unsavedChanges.buttons.discard')"
          flat
          @click="onDialogOK('discard')"
        />
        <q-btn
          v-close-popup
          class="bg-primary text-white"
          flat
          :label="t('unsavedChanges.buttons.save')"
          @click="onDialogOK('save')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
