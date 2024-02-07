<script setup lang="ts">
const columns = {
  machineId: {
    label: 'Makine Id',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'equals',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  machineCode: {
    label: 'Makine',
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'equals',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
}

const { data: machines, refresh } = useLazyFetch('/api/machines/other-machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData) {
  await $fetch('/api/machines/other-machine', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData, old) {
  await $fetch('/api/machines/other-machine', {
    method: 'PUT',
    body: {
      ...formData,
      oldId: old.machineId,
    },
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/machines/other-machine', {
    method: 'DELETE',
    body: {
      machineIds: formData.map(d => d.machineId),
    },
  })
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  machines.value = await $fetch('/api/machines/other-machines', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card>
    <FormTableKit
      :rows="machines" :columns="columns"
      @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
    />
  </q-card>
</template>
