<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MachineInfoDialog from '../machine/MachineInfoDialog.vue'
import type { Machine, MachineControllerType, MachineGroup } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const { data: machines, refresh: refreshMachines } = await useFetch<Machine[]>('/api/machines')
const { data: machineGroups } = useFetch<MachineGroup[]>('/api/machines/groups')
const { data: controllerTypes } = await useFetch<MachineControllerType[]>('/api/machines/types')
const columns: (QTableColumn<Machine>)[] = [
  {
    name: 'machineNo',
    label: t('machineFields.ID'),
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
    component: MachineInfoDialog,
    componentProps: {
      machine: selectedMachine,
      machineGroups: machineGroups.value,
      controllerTypes: controllerTypes.value,
      machines,
      dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMachines()
    } else
      notifyFail(t('Failed'))
  })
}
async function addNewMachine() {
  const dispensers = await dataStore.getDispensers()
  q.dialog({
    component: MachineInfoDialog,
    componentProps: {
      controllerTypes,
      machineGroups: machineGroups.value,
      dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMachines()
    } else
      notifyFail(t('Failed'))
  },
  )
}
const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex-center text-xl">
    {{ t('settings.Machine') }}
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
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
      type="Machines"
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
    :columns
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
