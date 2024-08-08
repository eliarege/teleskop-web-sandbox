<script setup lang="ts">
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import TBCreateProcessTypeDialog from './TBCreateProcessTypeDialog.vue'
import { notification } from '~/shared/functions'
import type { ProcessType } from '~/shared/types'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { fetch } = useKeycloak()
const $q = useQuasar()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const { data: programTypes, refresh } = useAuthFetch('/api/process', { default: () => [] })
const columns = computed(() => [
  { name: 'value', label: t('changeProcessTypeDialog.processTypeNo'), field: 'value', align: 'left' },
  { name: 'label', label: t('changeProcessTypeDialog.processTypeName'), field: 'label', align: 'left' },
  { name: 'description', label: t('changeProcessTypeDialog.note'), field: 'description', align: 'left' },
])
const selectedRow = ref()
async function handleUpdateProcessTypes() {
  const check = await fetch('/api/process', { method: 'PUT', body: programTypes.value })
  const status = check ? 'success' : 'fail'
  notification(check, t(`changeProcessTypeDialog.updateProcessTypes.${status}`, { no: selectedRow.value.value }))
  refresh()
}
function handleCreateProcessType() {
  $q.dialog({
    component: TBCreateProcessTypeDialog,
  }).onOk(async (type: ProcessType) => {
    let check
    try {
      check = await fetch('/api/process', { method: 'POST', body: type })
    } catch {
      check = false
    }
    const status = check ? 'success' : 'fail'
    notification(check, t(`changeProcessTypeDialog.createProcessType.${status}`, { no: type.value, name: type.label }))
    refresh()
  })
}
function handleDeleteProcessType() {
  $q.dialog({
    title: t('delete'),
    message: t('changeProcessTypeDialog.deletionWarning', { type: selectedRow.value.label }),
    cancel: {
      icon: 'close',
      label: t('cancel'),
      outline: true,
    },
    ok: {
      label: t('delete'),
      outline: true,
      icon: 'delete',
      color: 'red',
    },
    persistent: true,
  }).onOk(async () => {
    const check = await fetch('/api/process', { method: 'DELETE', body: selectedRow.value.value })
    const status = check ? 'success' : 'fail'
    notification(check, t(`changeProcessTypeDialog.deleteProcessType.${status}`, { no: selectedRow.value.value }))
    refresh()
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    class="wider-dialog"
  >
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.changeProcessType') }}</span>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </q-card-section>
      <q-card-section>
        <q-table
          flat
          class="h-150"
          bordered
          dense
          :pagination=" { rowsPerPage: 0 } "
          :rows="programTypes"
          :columns="columns"
          row-key="value"
          cursor="pointer"
          @row-click="(e, row) => selectedRow = row "
        >
          <template #body-cell="props">
            <q-td :props="props" :class="props.row === selectedRow ? '!e-selected' : ''">
              <q-input
                v-if="props.col.name !== 'value'"
                v-model="props.row[ props.col.name ]"
                dense
                borderless
              />
              <span v-else>
                {{ props.row[props.col.name] }}
              </span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('delete')"
          outline
          color="red"
          icon="delete"
          :disable="!selectedRow"
          @click="handleDeleteProcessType"
        />
        <q-btn
          :label="t('create')"
          outline
          color="primary"
          icon="create"
          @click="handleCreateProcessType"
        />
        <q-btn
          outline
          icon="save"
          :label="t('submit')"
          @click="handleUpdateProcessTypes"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.wider-dialog .q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
