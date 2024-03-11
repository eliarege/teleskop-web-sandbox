<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MachineInfo from '../machine/MachineInfo.vue'
import type { Machine, MachineControllerType } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const dataStore = useDataStore()
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
  {
    name: 'connectedDispensers',
    label: t('materialFields.ConnectedDispensers'),
    field: 'connectedDispensers',
    align: 'left',
  },
]

async function onRowClick(_event: Event, row: any) {
  const selectedMachine = await $fetch(`/api/machines/${row.machineId}`)
  const dispensers = await dataStore.getDispensers()
  q.dialog({
    component: MachineInfo,
    componentProps: {
      machine: selectedMachine,
      controllerTypes: controllerTypes.value,
      dispensers,
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
async function addNewMachine() {
  const dispensers = await dataStore.getDispensers()
  q.dialog({
    component: MachineInfo,
    componentProps: {
      controllerTypes,
      dispensers,
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
  },
  )
}
const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex-center text-xl mb-10">
    {{ t('settings.Machine') }}
  </div>
  <div class="flex-center mb-4">
    <QBtn
      :label="$t('AddNewMachine')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12 mr-2"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="addNewMachine"
    />
    <TeleskopSyncBtn
      class="ml-2"
      link="/api/teleskop/sync/machines"
      :min-size="800"
      @click="refreshMachines"
    />
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
        <span v-else-if="props.col.field === 'connectedDispensers'">
          {{ props.row.connectedDispensers?.map((connection: any) => connection.dispenserName).filter(Boolean).join(', ') || '-' }}
        </span>
        <span v-else>
          {{ props.value }}
        </span>
      </QTd>
    </template>
  </QTable>
</template>
