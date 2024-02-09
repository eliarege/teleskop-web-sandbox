<script setup lang="ts">
const { t } = useI18n()

const columns = {
  id: {
    label: 'ID',
    field: 'id',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  reasonText: {
    label: t('skippingReason'),
    field: 'reasonText',
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

}

const { data: stepSkippingReasons, refresh } = useLazyFetch('/api/step-skipping-reasons/step-skipping-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData) {
  console.log('formData = ', formData)
  await $fetch('/api/step-skipping-reasons/reason', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData, old) {
  console.log('formData = ', formData, old)
  await $fetch('/api/step-skipping-reasons/reason', {
    method: 'PUT',
    body: {
      ...formData,
      oldId: old.id,
    },
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/step-skipping-reasons/step-skipping-reasons', {
    method: 'DELETE',
    body: {
      reasonIds: formData.map(d => d.id),
    },
  })
  await refresh()
}
async function handleFilterSlotsUpdate(updatedValue) {
  stepSkippingReasons.value = await $fetch('/api/step-skipping-reasons/step-skipping-reasons', {
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
      <FormTableKit
        :rows="stepSkippingReasons" :columns="columns"
        @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
