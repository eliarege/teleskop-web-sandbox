<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak';

const { fetch } = useKeycloak()

const props = defineProps({
  processTypes: Array<any>,
  programsOrder: Array<any>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const details = ref({
  programNo: 1,
  name: '',
  processType: props.processTypes[0],
  operatorCanInterrupt: false,
  creationTime: new Date().toDateString(),
})
const route = useRoute()

const machineId = Number(route.params.machine_id)

const isProgramNoExist = ref(false)

async function updateModelValue(val) {
  details.value.programNo = val
  isProgramNoExist.value = await fetch(`/api/program/has-program/${machineId}/${details.value.programNo}`)
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.concatenateProgramsDialog.header') }}</span>
      </q-card-section>
      <q-card-section>
        <InputNumber
          :model-value="details.programNo"
          type="positive-integer"
          :min="1"
          :error="!details.programNo || isProgramNoExist"
          :error-message="!details.programNo ? (t('contextMenu.concatenateProgramsDialog.warningNoPK')) : (t('contextMenu.concatenateProgramsDialog.warningDuplicatePK'))"
          :label="t('contextMenu.concatenateProgramsDialog.programNo')"
          @update:model-value="e => updateModelValue(e)"
        />
        <q-input v-model="details.name" :label="t('contextMenu.concatenateProgramsDialog.name')" />
        <q-select
          v-model="details.processType"
          :options="props.processTypes"
          :label="t('contextMenu.concatenateProgramsDialog.processType')"
        />
        <q-checkbox v-model="details.operatorCanInterrupt" :label="t('contextMenu.concatenateProgramsDialog.operatorCanInterrupt')" />
        <q-input
          v-model="details.creationTime"
          :label="t('contextMenu.concatenateProgramsDialog.creationTime')"
          disable
        />
      <!-- <q-btn :label="t('contextMenu.concatenateProgramsDialog.programList')" /> -->
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          outline
          :label="t('contextMenu.concatenateProgramsDialog.concatenate')"
          icon="check"
          :disable="!details.programNo || isProgramNoExist"
          @click="onDialogOK({ programsOrder, details })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
