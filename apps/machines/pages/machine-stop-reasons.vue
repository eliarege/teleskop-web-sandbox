<script setup lang="ts">
import type { StopReason } from '~/types'

const kc = useKeycloak()
const { t } = useI18n()

const columns = computed(() => ({
  stopCode: {
    label: `${t('idle')} ID`,
    field: 'stopCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: true,
    editable: true,
    unique: true,
    schema: {
      filled: true,
      validation: 'required|min:1',
    },
  },
  stopName: {
    label: t('idleCause'),
    field: 'stopName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  reportToERP: {
    label: t('erpFailureNotification'),
    field: 'reportToERP',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: true,
    editable: true,
    format: (val: boolean) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
    },
  },

}))

const { data: stopReasons, refresh } = useAuthFetch<StopReason[]>('/api/stop-reasons/stop-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleEdit(formData: StopReason) {
  await kc.fetch('/api/stop-reasons/stop-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleAdd(formData: StopReason) {
  const stopCode = formData.stopCode || (stopReasons.value.length === 0
    ? 1
    : stopReasons.value[stopReasons.value.length - 1].stopCode + 1)

  await kc.fetch('/api/stop-reasons/stop-reason', {
    method: 'POST',
    body: {
      stopCode,
      stopName: formData.stopName,
      reportToERP: formData.reportToERP,
    },
  })
  await refresh()
}

async function handleDelete(formData: StopReason[]) {
  await kc.fetch('/api/stop-reasons/stop-reasons', {
    method: 'DELETE',
    body: {
      stopCodes: formData.map(d => d.stopCode),
    },
  })
  await refresh()
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-between">
        <h3>
          {{ t('idleInfo') }}
        </h3>
      </div>
      <FormTableKit
        :rows="stopReasons"
        :columns="columns"
        form-class="grid grid-cols-1 grid-rows-2 h-70 w-80"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
