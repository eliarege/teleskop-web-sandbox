<script setup lang="ts">
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import TBCreateProcessTypeDialog from './TBCreateProcessTypeDialog.vue'
import { notification } from '~/shared/functions'
import type { ProcessType } from '~/shared/types'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const $q = useQuasar()
const { t } = useI18n()
const { fetch } = useKeycloak()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const selectedRow = ref()
const { data: programTypes, refresh } = useAuthFetch('/api/process', { default: () => [] })

const columns = computed(() => [
  { name: 'value', label: t('changeProcessTypeDialog.processTypeNo'), field: 'value', align: 'left' },
  { name: 'label', label: t('changeProcessTypeDialog.processTypeName'), field: 'label', align: 'left' },
  { name: 'description', label: t('changeProcessTypeDialog.note'), field: 'description', align: 'left' },
])

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
  <QDialog
    ref="dialogRef"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('contextMenu.changeProcessType') }}
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
      </QCardSection>

      <QCardSection>
        <QTable
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
            <QTd :props="props" :class="props.row === selectedRow ? '!e-selected' : ''">
              <QInput
                v-if="props.col.name !== 'value'"
                v-model="props.row[ props.col.name ]"
                dense
                borderless
              />
              <span v-else>
                {{ props.row[props.col.name] }}
              </span>
            </QTd>
          </template>
        </QTable>
      </QCardSection>

      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('create')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          icon="create"
          flat
          @click="handleCreateProcessType"
        />
        <QBtn
          :label="t('delete')"
          class="q-mr-sm bg-red-6"
          icon="delete"
          :disable="!selectedRow"
          flat
          @click="handleDeleteProcessType"
        />
        <QBtn
          :label="t('submit')"
          class="q-mr-sm bg-primary"
          icon="save"
          flat
          @click="handleUpdateProcessTypes"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style scoped>
.q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
