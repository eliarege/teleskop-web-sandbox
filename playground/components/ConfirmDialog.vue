<script setup lang="ts">
import type { QBtnProps, QDialogProps } from 'quasar'

type ButtonAction = {
  label: string
  value: string
  props?: QBtnProps
}

const props = withDefaults(defineProps<{
  title?: string
  message?: string
  okActions?: ButtonAction[]
  cancelLabel?: string
  noTransition?: boolean
  dialogProps?: QDialogProps
}>(), {
  title: 'Confirm',
  message: 'Are you sure you want to proceed?',
  okActions: () => [{ label: 'Confirm', value: 'confirm' }],
  cancelLabel: 'Cancel',
})
defineEmits(useDialogPluginComponent.emits)
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    v-bind="props.dialogProps"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6 flex">
          {{ props.title }}
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
        {{ props.message }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-for="action in props.okActions"
          :key="action.value"
          color="primary"
          no-caps
          v-bind="action.props"
          :label="action.label"
          @click="onDialogOK(action.value)"
        />
        <q-btn
          color="primary"
          no-caps
          :label="props.cancelLabel"
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
