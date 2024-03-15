<script setup lang="ts">
import { useDataStore } from '~/store/DataStore'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  dispenserId: {
    type: Number,
    required: true,
  },
})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const dataStore = useDataStore()
const dispensers = dataStore.dispensers
const selected = ref()

async function onConfirm() {
  try {
    const res = await $fetch(`/api/connections/materials/export?from=${props.dispenserId}&to=${selected.value}`, { method: 'POST' })
    onDialogOK(res)
  } catch (e: any) {
    onDialogOK(null)
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <div flex-center>
        <QSelect
          v-model="selected"
          dense
          filled
          class="w-50% mt-10"
          emit-value
          map-options
          options-dense
          option-value="dispenserId"
          option-label="dispenserName"
          :options="dispensers"
        />
      </div>
      <div class="flex-center justify-evenly p-10">
        <QBtn
          :label="t('Confirm')"
          color="primary"
          icon="file_upload"
          @click="onConfirm"
        />
        <QBtn
          :label="t('Cancel')"
          color="negative"
          icon="cancel"
          @click="onDialogCancel"
        />
      </div>
    </QCard>
  </QDialog>
</template>

<style scoped lang="postcss">
</style>
