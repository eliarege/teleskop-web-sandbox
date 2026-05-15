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
defineEmits([...useDialogPluginComponent.emits])
const { t } = useI18n()
const dataStore = useDataStore()
const dispensers = dataStore.dispensers
const selected = ref([])

async function onConfirm() {
  try {
    await $fetch(`/api/connections/${props.type}/export`, { method: 'POST', body: { from: props.dispenserId, to: selected.value } })
    onDialogOK(true)
  } catch (e: any) {
    onDialogOK(null)
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    persistent
    @hide="onDialogHide"
  >
    <QCard class="scroll border-b-solid border-10px border-grey">
      <div
        flex-center
        flex-col
        mt-10
        text-lg
      >
        <div>
          {{ t('CopyConnectionsBody', { type: t(`${capitalizeFirst(props.type)}`), dispenser: dataStore.selectedDispenser?.dispenserName }) }}
        </div>
        <QSelect
          v-model="selected"
          dense
          filled
          class="w-50% mt-10"
          multiple
          emit-value
          map-options
          options-dense
          option-value="dispenserId"
          option-label="dispenserName"
          :options="dispensers?.filter(dispenser => dispenser.dispenserId !== dispenserId)"
        />
      </div>
      <div class="flex-center justify-evenly p-10">
        <QBtn
          :label="t('Confirm')"
          color="primary"
          icon="done"
          :disable="selected.length < 1"
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
