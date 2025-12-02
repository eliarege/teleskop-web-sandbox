<script setup lang="ts">
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard class="w-120">
      <QCardSection class="row items-center">
        <span class="text-4"> {{ t('unsavedChanges.title') }}</span>
        <QSpace />
        <QBtn
          v-close-popup
          round
          flat
          size="sm"
          dense
          icon="close"
          class="text-gray-4 dark:text-gray-6"
          @click="onDialogCancel"
        />
      </QCardSection>
      <QCardSection>
        {{ t('unsavedChanges.message') }}
      </QCardSection>
      <QCardActions align="right" class="bg-gray-1 dark:bg-dark-4">
        <QBtn
          v-close-popup
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('unsavedChanges.buttons.cancel')"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          v-close-popup
          class=" bg-red text-white"
          :label="t('unsavedChanges.buttons.discard')"
          flat
          @click="onDialogOK('discard')"
        />
        <QBtn
          v-close-popup
          class="bg-primary text-white"
          flat
          :label="t('unsavedChanges.buttons.save')"
          @click="onDialogOK('save')"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
