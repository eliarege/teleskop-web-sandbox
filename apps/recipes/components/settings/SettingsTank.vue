<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MachineTankDialog from '../machine/MachineTankDialog.vue'
import type { Tank } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const dispensers = await dataStore.getDispensers()
const { data: tanks, refresh: refreshTanks } = await useFetch<Tank[]>('/api/machines/tanks')
const columns: (QTableColumn<Tank>)[] = [
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
    name: 'tankName',
    label: t('machineFields.TankName'),
    field: 'tankName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'dispenserId',
    label: t('materialFields.ConnectedDispensers'),
    field: 'dispenserId',
    align: 'left',
  },
]

async function onTankClick(machineId: number | null, tankNo: number, isNew: boolean) {
  const tankNos = tanks.value?.filter(tank => tank.machineId === machineId).map(tank => tank.tankNo)
  q.dialog({
    component: MachineTankDialog,
    componentProps: {
      machineId,
      tankNo,
      tankNos,
      isNew,
      dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshTanks()
    } else
      notifyFail(t('Failed'))
  })
}
const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="text-xl">
      {{ t('settings.Tank') }}
    </div>
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <div class="flex justify-center items-center mb-4">
    <QBtn
      :label="t('machineFields.AddNewTank')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="onTankClick(null, tanks && tanks.length > 0 ? tanks[tanks.length - 1].tankNo + 1 : 1, true)"
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
    :rows="tanks"
    row-key="name"
    @row-click="(_, row: any) => onTankClick(row.machineId, row.tankNo, false)"
  />
</template>
