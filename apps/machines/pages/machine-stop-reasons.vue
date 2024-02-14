<script setup lang="ts">
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
      validation: 'required',
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
    format: (val, row) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
    },
  },

}))

const { data: stopReasons, refresh } = useLazyFetch('/api/stop-reasons/stop-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleEdit(formData) {
  await $fetch('/api/stop-reasons/stop-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleAdd(formData) {
  await $fetch('/api/stop-reasons/stop-reason', {
    method: 'POST',
    body: {
      stopCode: stopReasons.value[stopReasons.value.length - 1].stopCode + 1,
      stopName: formData.stopName,
      reportToERP: formData.reportToERP,
    },
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/stop-reasons/stop-reasons', {
    method: 'DELETE',
    body: {
      stopCodes: formData.map(d => d.stopCode),
    },
  })
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  stopReasons.value = await $fetch('/api/stop-reasons/stop-reasons', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
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
        :rows="stopReasons" :columns="columns"
        @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
