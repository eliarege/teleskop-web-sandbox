<script setup lang="ts">
import type { Machine } from '~/types'

const kc = useKeycloak()
const { notifySuccess, notifyError } = useNotify()
const { t } = useI18n()

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
  try {
    await kc.fetch('/api/machines/other-machine', {
      method: 'POST',
      body: formData,
    })
    notifySuccess(t('machineAddedSuccessfully'))
    await refresh()
  } catch (error: any) {
    if (error.status === 409) {
      notifyError(t('machineDuplicateId'))
    } else {
      notifyError(t('errorAddingMachine'))
    }
  }
}

async function handleEdit(formData: Machine, old: Machine) {
  try {
    await kc.fetch('/api/machines/other-machine', {
      method: 'PUT',
      body: {
        ...formData,
        oldId: old.machineId,
      },
    })
    notifySuccess(t('machineUpdatedSuccessfully'))
    await refresh()
  } catch (error: any) {
    if (error.status === 409) {
      notifyError(t('machineDuplicateId'))
    } else {
      notifyError(t('errorUpdatingMachine'))
    }
  }
}

async function handleDelete(formData: Machine[]) {
  try {
    await kc.fetch('/api/machines/other-machine', {
      method: 'DELETE',
      body: {
        machineIds: formData.map(d => d.machineId),
      },
    })
    notifySuccess(t('machinesDeletedSuccessfully'))
    await refresh()
  } catch (error: any) {
    notifyError(t('errorDeletingMachines'))
  }
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
