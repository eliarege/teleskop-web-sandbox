<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  saveLabel?: string
  discardLabel?: string
  cancelLabel?: string
}>(), {
  title: 'Confirm',
  message: 'You have unsaved changes. What would you like to do?',
  saveLabel: 'Save',
  discardLabel: 'Don\'t Save',
  cancelLabel: 'Cancel',
})

defineEmits(useDialogPluginComponent.emits)
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    transition-duration="150"
    transition-show="fade"
    transition-hide="fade"
    no-backdrop-dismiss
    no-shake
    @hide="onDialogHide"
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6 flex">
          {{ title }}
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
      </q-card-section>

      <q-card-section>
        <div>
          {{ message }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="saveLabel"
          flat
          color="primary"
          no-caps
          @click="onDialogOK('confirm')"
        />
        <q-btn
          :label="discardLabel"
          flat
          color="secondary"
          no-caps
          @click="onDialogOK('discard')"
        />
        <q-btn
          :label="cancelLabel"
          flat
          no-caps
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
