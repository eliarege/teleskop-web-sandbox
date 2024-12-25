<script setup lang="ts">
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef">
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
          class="float-right"
          @click="onDialogCancel"
        />
      </q-card-section>
      <q-card-section>
        {{ t('discardChanges.message') }}
      </q-card-section>
      <q-card-actions align="right" class="bg-gray-1 dark:bg-dark-4">
        <q-btn
          v-close-popup
          class="bg-primary text-white"
          :label="t('discardChanges.cancel')"
          icon="close"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          class=" bg-red text-white"
          :label="t('discardChanges.discard')"
          icon="delete"
          flat
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
