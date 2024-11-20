<script setup lang="ts">
import type { Machine } from '~/types'

const columns = computed(() => ({
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
      validation: 'required|min:1',
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
}))

const { data: machines, refresh } = useAuthFetch<Machine[]>('/api/machines/other-machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData: Machine) {
  await $fetch('/api/machines/other-machine', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: Machine, old: Machine) {
  await $fetch('/api/machines/other-machine', {
    method: 'PUT',
    body: {
      ...formData,
      oldId: old.machineId,
    },
  })
  await refresh()
}

async function handleDelete(formData: Machine[]) {
  await $fetch('/api/machines/other-machine', {
    method: 'DELETE',
    body: {
      machineIds: formData.map(d => d.machineId),
    },
  })
  await refresh()
}
</script>

<template>
  <q-card>
    <FormTableKit
      :rows="machines"
      :columns="columns"
      form-class="grid grid-cols-1 grid-rows-2 h-70 w-80"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </q-card>
</template>
