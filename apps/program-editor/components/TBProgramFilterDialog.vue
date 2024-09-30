<script setup lang="ts">
import { QCheckbox, QInput, QSelect } from 'quasar'
import InputNumber from './InputNumber.vue'
import type { ProgramFilter } from '~/shared/types'

defineEmits([
  ...useDialogPluginComponent.emits,
])
const filter: ProgramFilter = ref({ clearOnChange: false })

const editor = useEditorStore()
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
function clearFilters() {
  clearFilter()
  onDialogOK(filter)
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="bg-gray-1 text-center">
        <div>
          {{ t('topbar.programFilter._') }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-pa-md justify-center">
          <InputNumber
            v-model="filter.programNo"
            type="positive-integer"
            :label="t('topbar.programFilter.programNo')"
            dense
          />
          <QInput
            v-model="filter.programName"
            dense
            :label="t('topbar.programFilter.programName')"
          />
          <QSelect
            v-model="filter.processType"
            class="q-mt-md"
            dense
            options-dense
            :options="editor.allProcessType"
            :label="t('topbar.programFilter.processType')"
          />
          <QCheckbox
            v-model="filter.clearOnChange"
            class="q-mt-md"
            color="black"
            :label="t('topbar.programFilter.clearFilterOnChange')"
          />
        </div>
      </q-card-section>

      <q-card-actions class="bg-gray-1" align="right">
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
          :label="t('topbar.programFilter.clearFilter')"
          icon="delete"
          @click="clearFilters"
        />
        <q-btn
          v-close-popup
          outline
          :disable="!(filter.processType || filter.programName || filter.programNo) "
          :label="t('apply')"
          icon="check"
          @click="onDialogOK(filter)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
