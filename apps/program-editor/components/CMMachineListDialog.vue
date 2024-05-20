<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  type: String,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const selectedMachines = ref([])
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t(`contextMenu.${props.type}.selectMachine`) }}</span>
      </q-card-section>
      <q-card-section>
        <div class="flex items-center justify-center max-h-100 overflow-auto">
          <MachineList :is-ticked="true" @update:ticked="e => selectedMachines = e" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          outline
          :color="props.type === 'deleteFromMultiMachine' ? 'red' : ''"
          :icon="props.type === 'deleteFromMultiMachine' ? 'delete' : 'send'"
          :label="t(`contextMenu.${props.type}.operate`)"
          @click="onDialogOK(selectedMachines)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
