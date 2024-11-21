<script setup lang="ts">
import type { StepReason } from '~/types'

const { t } = useI18n()
const kc = useKeycloak()
const columns = computed(() => ({
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
      validation: 'required|min:1',
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

}))

const { data: stepSkippingReasons, refresh } = useAuthFetch<StepReason[]>('/api/step-skipping-reasons/step-skipping-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData: StepReason) {
  await kc.fetch('/api/step-skipping-reasons/reason', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: StepReason, old: StepReason) {
  await kc.fetch('/api/step-skipping-reasons/reason', {
    method: 'PUT',
    body: {
      ...formData,
      oldId: old.id,
    },
  })
  await refresh()
}

async function handleDelete(formData: StepReason[]) {
  await kc.fetch('/api/step-skipping-reasons/step-skipping-reasons', {
    method: 'DELETE',
    body: {
      reasonIds: formData.map(d => d.id),
    },
  })
  await refresh()
}
</script>

<template>
  <q-card>
    <q-card-section>
      <FormTableKit
        :rows="stepSkippingReasons"
        :columns="columns"
        form-class="grid grid-cols-1 grid-rows-2 h-70 w-80"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
