<script setup lang="ts">
import type { ProgramFilter } from '~/shared/types'

const props = defineProps({
  processTypes: Array<any>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const filter: ProgramFilter = ref({ clearOnChange: false })
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
function clearFilters() {
  setExistingFilter({
    programNo: 1,
    programName: '',
    processType: { value: 1, label: '' },
    clearOnChange: true,
  })
  onDialogOK(filter)
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('topbar.programFilter._') }}</span>
      </q-card-section>
      <q-card-section>
        <div class="flex flex-col gap-5 m-5">
          <q-input
            v-model="filter.programNo"
            dense
            filled
            :label="t('topbar.programFilter.programNo')"
          />
          <q-input
            v-model="filter.programName"
            dense
            filled
            :label="t('topbar.programFilter.programName')"
          />
          <q-select
            v-model="filter.processType"
            dense
            :options="processTypes"
            filled
            :label="t('topbar.programFilter.processType')"
          />
          <q-checkbox
            v-model="filter.clearOnChange"
            color="black"
            :label="t('topbar.programFilter.clearFilterOnChange')"
          />
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
          :label="t('topbar.programFilter.clearFilter')"
          @click="clearFilters"
        />
        <q-btn
          v-close-popup
          outline
          :disable="!(filter.processType || filter.programName || filter.programNo) "
          :label="t('apply')"
          @click="onDialogOK(filter)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
