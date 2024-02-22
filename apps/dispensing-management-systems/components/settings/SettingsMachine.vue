<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MachineInfo from '../MachineInfo.vue'
import type { Machine, MachineControllerType } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const { data: machines, refresh: refreshMachines } = await useFetch<Machine[]>('/api/machines')

const { data: controllerTypes } = await useFetch<MachineControllerType[]>('/api/machines/types')

const columns: (QTableColumn<Machine>)[] = [
  {
    name: 'machineNo',
    label: t('machineFields.No'),
    field: 'machineId',
    sortable: true,
    align: 'left',
  },
  {
    name: 'machineName',
    label: t('machineFields.Name'),
    field: 'machineName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'controllerType',
    label: t('machineFields.ControllerType'),
    field: 'controllerType',
    sortable: true,
    align: 'left',
  },
]

async function onRowClick(_event: Event, row: any) {
  const selectedMachine = await $fetch(`/api/machines/${row.machineId}`)
  q.dialog({
    component: MachineInfo,
    componentProps: {
      machine: selectedMachine,
      controllerTypes: controllerTypes.value,
    },
  }).onOk((payload) => {
    if (payload) {
      q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'done',
        message: t('Success'),
        timeout: 3000,
      })
      refreshMachines()
    } else
      q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cancel',
        message: t('Failed'),
        timeout: 3000,
      })
  })
}
const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex-center text-xl mb-10">
    {{ t('settings.Machine') }}
  </div>
  <QTable
    flat
    bordered
    table-header-class="table-header"
    table-class="max-h-150"
    separator="cell"
    :pagination
    :columns="columns"
    :rows="machines"
    row-key="name"
    @row-click="onRowClick"
  >
    <template #body-cell="props">
      <QTd
        :props="props"
      >
        <span v-if="props.col.field === 'controllerType'">
          {{ controllerTypes?.find(type => type.controllerTypeId === props.value)?.controllerTypeName }}
        </span>
        <span v-else>
          {{ props.value }}
        </span>
      </QTd>
    </template>
  </QTable>
</template>
