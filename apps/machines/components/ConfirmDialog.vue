<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: string
  persistent?: boolean
}>(), {
  title: 'Confirm',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmColor: 'primary',
  persistent: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const localModelValue = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function onConfirm() {
  emit('confirm')
  localModelValue.value = false
}

function onCancel() {
  emit('cancel')
  localModelValue.value = false
}
</script>

<template>
  <q-dialog
    v-model="localModelValue"
    :persistent="persistent"
    class="select-none"
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
            @click="onCancel"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div>
          {{ message }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <q-btn
          :label="cancelLabel"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="onCancel"
        />
        <q-btn
          :label="confirmLabel"
          :class="`q-mr-sm bg-${confirmColor} text-white`"
          flat
          @click="onConfirm"
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
