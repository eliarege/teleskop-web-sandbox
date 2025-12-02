<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import TBCreateProcessTypeDialog from './TBCreateProcessTypeDialog.vue'
import TBDeleteProcessTypeDialog from './TBDeleteProcessTypeDialog.vue'
import type { ProcessType } from '~/shared/types'

defineEmits([...useDialogPluginComponent.emits])

const $q = useQuasar()
const { t } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const editor = useEditorStore()

const selectedRow = ref<ProcessType[]>([])
const columns: QTableColumn[] = [
  { name: 'value', label: t('processTypeDialog.processTypeNo'), field: 'value', align: 'center', sortable: true },
  { name: 'label', label: t('processTypeDialog.processTypeName'), field: 'label', align: 'center', sortable: true },
  { name: 'description', label: t('processTypeDialog.note'), field: 'description', align: 'center', sortable: true },
]

function handleCreateProcessType() {
  $q.dialog({
    component: TBCreateProcessTypeDialog,
  }).onOk(async (result: { processType: ProcessType, originalProcessCode?: number }) => {
    await editor.addProcessType(result.processType)
    // Eklenen kaydı seç
    selectedRow.value = [result.processType]
  })
}

function handleEditProcessType() {
  if (!selectedRow.value.length)
    return
  const row = selectedRow.value[0]
  $q.dialog({
    component: TBCreateProcessTypeDialog,
    componentProps: { processType: row },
  }).onOk(async (result: { processType: ProcessType, originalProcessCode?: number }) => {
    await editor.updateProcessType(result.processType, result.originalProcessCode)
    // Güncellenmiş kaydı seç
    selectedRow.value = [result.processType]
  })
}

function handleDeleteProcessType() {
  if (!selectedRow.value.length)
    return
  const row = selectedRow.value[0]
  $q.dialog({
    component: TBDeleteProcessTypeDialog,
    componentProps: { processType: row },
  }).onOk(async () => {
    await editor.deleteProcessType(row.value)
    // Silinen kayıt seçimini temizle
    selectedRow.value = []
  })
}

function onRowClick(event: Event, row: ProcessType) {
  selectedRow.value = [row]
}

function onRowDoubleClick(event: Event, row: ProcessType) {
  selectedRow.value = [row]
  handleEditProcessType()
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-120 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('processTypeDialog.title') }}
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
        <div class="flex gap-2 mb-3">
          <q-btn
            :label="t('processTypeDialog.createProcessType.newProcessType')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            @click="handleCreateProcessType"
          />
          <q-btn
            :label="t('edit')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            :disable="!selectedRow.length"
            @click="handleEditProcessType"
          />
          <q-btn
            :label="t('delete')"
            class="bg-negative text-white"
            flat
            :disable="!selectedRow.length"
            @click="handleDeleteProcessType"
          />
        </div>
        <q-table
          v-model:selected="selectedRow"
          class="h-100"
          :columns="columns"
          :rows="editor.allProcessTypes"
          row-key="value"
          selection="single"
          hide-bottom
          bordered
          flat
          dense
          :rows-per-page-options="[0]"
          table-header-style="position: sticky; top: 0; z-index: 1; height: 40px;"
          table-header-class="bg-gray-1 dark:bg-dark-4"
          @row-click="onRowClick"
          @row-dblclick="onRowDoubleClick"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
