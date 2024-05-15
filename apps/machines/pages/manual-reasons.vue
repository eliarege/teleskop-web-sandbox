<script setup lang="ts">
const { t } = useI18n()

const columns = computed(() => ({
  manualId: {
    label: 'Manual Id',
    field: 'manualId',
    align: 'left',
    filterable: true,
    unique: true,
    filterType: 'includes',
    visible: true,
    editable: true,
    type: 'number',
  },
  manualReason: {
    label: t('manualReason'),
    field: 'manualReason',
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
    label: t('reportToERP'),
    field: 'reportToERP',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    visible: true,
    type: 'checkbox',
    editable: true,
    format: (val, row) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
    },
  },
}))

const { data: manualReasons, refresh } = useLazyFetch('/api/manual-reasons/manual-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})
async function handleAdd(formData) {
  await $fetch('/api/manual-reasons/manual-reason', {
    method: 'POST',
    body: {
      manualId: manualReasons.value[manualReasons.value.length - 1].manualId + 1,
      manualReason: formData.manualReason,
      reportToERP: formData.reportToERP,
    },
  })
  await refresh()
}

async function handleEdit(formData) {
  await $fetch('/api/manual-reasons/manual-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/manual-reasons/manual-reasons', {
    method: 'DELETE',
    body: {
      manualIds: formData.map(d => d.manualId),
    },
  })
  await refresh()
}
async function handleFilterSlotsUpdate(updatedValue) {
  manualReasons.value = await $fetch('/api/manual-reasons/manual-reasons', {
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
          {{ t('manualReasonDescription') }}
        </h3>
      </div>
      <FormTableKit
        :rows="manualReasons"
        :columns="columns"
        form-class="grid grid-cols-1 grid-rows-2 h-60 w-80"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
