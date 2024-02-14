<script setup lang="ts">
const { t } = useI18n()

const { data: finishReasons, refresh } = useLazyFetch('/api/finish-reasons/finish-reasons', {
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
    format: (val, row) => finishOptions.find(d => d.value === val)?.label || val,
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

async function handleFilterSlotsUpdate(updatedValue) {
  finishReasons.value = await $fetch('/api/finish-reasons/finish-reasons', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}

async function handleAdd(formData) {
  await $fetch('/api/finish-reasons/finish-reason', {
    method: 'POST',
    body: {
      reasonId: finishReasons.value[finishReasons.value.length - 1].reasonId + 1,
      formData,
    },
  })
  await refresh()
}

async function handleEdit(formData) {
  await $fetch('/api/finish-reasons/finish-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/finish-reasons/finish-reasons', {
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
      :rows="finishReasons" :columns="columns"
      @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
    />
  </div>
</template>
