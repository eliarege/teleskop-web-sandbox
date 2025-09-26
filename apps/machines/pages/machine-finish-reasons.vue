<script setup lang="ts">
import type { FinishReason } from '~/types'

const kc = useKeycloak()
const { t } = useI18n()

const { data: finishReasons, refresh } = useAuthFetch<FinishReason[]>('/api/finish-reasons/finish-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

const finishOptions = [
  { label: t('finish'), value: 3 },
  { label: t('skip'), value: 4 },
  { label: t('machinePause'), value: 5 },
]

const columns = computed(() => ({
  reasonId: {
    label: 'ID',
    field: 'reasonId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
  },
  typeId: {
    label: t('type'),
    field: 'typeId',
    align: 'left',
    type: 'select',
    format: (val: number) => finishOptions.find(d => d.value === val)?.label || val,
    filterable: true,
    filterType: 'includes',
    editable: true,
    visible: true,
    schema: {
      validation: 'required',
      options: finishOptions,
    },
  },
  text: {
    label: t('description'),
    field: 'text',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    editable: true,
    visible: true,
    renderCell: (row: any): VNode => h('span', {}, row.text),
    schema: {
      filled: true,
      validation: 'required',
    },
  },
}))

async function handleAdd(formData: FinishReason) {
  const nextId = finishReasons.value.length === 0
    ? 1
    : finishReasons.value[finishReasons.value.length - 1].reasonId + 1

  await kc.fetch('/api/finish-reasons/finish-reason', {
    method: 'POST',
    body: {
      reasonId: nextId,
      formData,
    },
  })
  await refresh()
}

async function handleEdit(formData: FinishReason) {
  await kc.fetch('/api/finish-reasons/finish-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData: FinishReason[]) {
  await kc.fetch('/api/finish-reasons/finish-reasons', {
    method: 'DELETE',
    body: {
      reasonIds: formData.map(d => d.reasonId),
    },
  })
  await refresh()
}
</script>

<template>
  <div
    class="p-2"
  >
    <FormTableKit
      :rows="finishReasons"
      :columns="columns"
      form-class="grid grid-cols-1 grid-rows-2 h-70 w-80"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
