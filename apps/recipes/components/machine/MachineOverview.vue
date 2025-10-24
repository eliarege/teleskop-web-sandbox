<script lang="ts" setup>
import { QCardSection } from 'quasar'
import type { QTableColumn } from 'quasar'
import DispenserEditDialog from '../dispenser/DispenserEditDialog.vue'
import MachineInfoDialog from './MachineInfoDialog.vue'
import MachineTankDialog from './MachineTankDialog.vue'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserType, Machine, MachineControllerType, MachineGroup, Tank } from '~/shared/types'

const { t } = useI18n()
const q = useQuasar()
const { notifySuccess, notifyFail } = useNotify()

const dataStore = useDataStore()

await dataStore.getDispensers()
const { data: controllerTypes } = useFetch<MachineControllerType[]>('/api/machines/types')
const { data: machineGroups } = useFetch<MachineGroup[]>('/api/machines/groups')
const { data: dispenserTypes } = useFetch<DispenserType[]>('/api/dispensers/types')
const innerWidth = ref(window.innerWidth)
const minSize = 1400

const dispenserColumns: (QTableColumn<Dispenser>)[] = [
  {
    name: 'dispenserid',
    required: true,
    label: t('dispenserFields.ID'),
    align: 'center',
    field: 'dispenserId',
    format: val => `${val}`,
    sortable: true,
  },
  { name: 'dispensername', label: t('dispenserFields.Name'), align: 'center', field: 'dispenserName', sortable: true },
  { name: 'ip', label: t('dispenserFields.IP'), field: 'dispenserIP' },
  { name: 'type', label: t('dispenserFields.Type'), field: 'dispenserType' },
  { name: 'protocol', label: t('dispenserFields.Protocol'), field: 'protocol' },
]

const machineColumns: (QTableColumn<Machine>)[] = [
  {
    name: 'machineid',
    required: true,
    label: t('machineFields.ID'),
    align: 'center',
    field: 'machineId',
    format: val => `${val}`,
    sortable: true,
  },
  { name: 'machinename', label: t('machineFields.Name'), align: 'center', field: 'machineName', sortable: true },
  {
    name: 'connectedDispensers',
    label: t('materialFields.ConnectedDispensers'),
    field: 'connectedDispensers',
    align: 'left',
  },
]
const { data: machines, refresh: refreshMachines } = await useFetch(`/api/machines`)

async function handleNewDispenser() {
  q.dialog({
    component: DispenserEditDialog,
  }).onOk(() => {
    refreshDispensers()
    notifySuccess(t('Success'))
  })
}

async function handleNewMachine() {
  q.dialog({
    component: MachineInfoDialog,
    componentProps: {
      controllerTypes: controllerTypes.value,
      machineGroups: machineGroups.value,
      machines,
      dispensers: dataStore.dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMachines()
    } else {
      notifyFail(t('Failed'))
    }
  })
}
async function refreshDispensers() {
  const dispensers = await $fetch<Dispenser[]>(`/api/dispensers`)
  dataStore.dispensers = dispensers
}

const expandedDispensers = ref<number[]>([])
const expandedMachines = ref<number[]>([])

function toggleDispenserRow(id: number) {
  if (!expandedDispensers.value.includes(id)) {
    expandedDispensers.value.push(id)
  } else {
    const index = expandedDispensers.value.indexOf(id)
    expandedDispensers.value.splice(index, 1)
  }
}

function toggleMachineRow(id: number) {
  if (!expandedMachines.value.includes(id)) {
    expandedMachines.value.push(id)
  } else {
    const index = expandedMachines.value.indexOf(id)
    expandedMachines.value.splice(index, 1)
  }
}
function onDispenserClick(row: any) {
  q.dialog({
    component: DispenserEditDialog,
    componentProps: { dispenser: row },
  }).onOk(() => {
    refreshDispensers()
    notifySuccess(t('Success'))
  })
}
async function onMachineClick(row: any) {
  const selectedMachine = await $fetch(`/api/machines/${row.machineId}`)
  q.dialog({
    component: MachineInfoDialog,
    componentProps: {
      machine: selectedMachine,
      controllerTypes: controllerTypes.value,
      machines,
      dispensers: dataStore.dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMachines()
    } else
      notifyFail(t('Failed'))
  })
}

async function onTankClick(machineId: number, tanks: Array<Tank>, tankNo: number, isNew: boolean) {
  const tankNos = tanks.map(tank => tank.tankNo)
  q.dialog({
    component: MachineTankDialog,
    componentProps: {
      machineId,
      tankNo,
      tankNos,
      isNew,
      dispensers: dataStore.dispensers,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMachines()
    } else
      notifyFail(t('Failed'))
  })
}

function handleResize() {
  innerWidth.value = window.innerWidth
}
useResizeObserver(document.body, () => {
  handleResize()
})
const dispenserPagination = ref({ rowsPerPage: 20 })
const machinePagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div
    h-full
    flex
    place-content-center
    all:transition-400
    flex-wrap
  >
    <div class="q-pa-md">
      <QCard bordered>
        <QCardSection class="flex justify-center items-center">
          <QBtn
            :label="innerWidth > minSize ? t('AddNewDispenser') : ''"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 h-12 overflow-hidden"
            style="white-space: nowrap; text-overflow: ellipsis;"
            clickable
            @click="handleNewDispenser"
          >
            <QTooltip
              v-if="innerWidth <= minSize"
              :offset="[10, 10]"
            >
              {{ t('AddNewDispenser') }}
            </QTooltip>
          </QBtn>
          <TeleskopSyncBtn
            type="Dispensers"
            :min-size="1400"
            @click="refreshDispensers"
          />
        </QCardSection>
      </QCard>

      <QTable
        v-if="dataStore.dispensers"
        v-model:pagination="dispenserPagination"
        :title="t('Dispensers')"
        :rows="dataStore.dispensers"
        :columns="dispenserColumns"
        separator="cell"
        virtual-scroll
        style="height: 700px"
        flat
        bordered
      >
        <template #header="props">
          <QTr :props="props">
            <QTh auto-width />
            <QTh
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </QTh>
          </QTr>
        </template>

        <template #body="props">
          <QTr
            :props="props"
            style="cursor:pointer"
            @click="onDispenserClick(props.row)"
          >
            <QTd auto-width>
              <QBtn
                size="sm"
                color="accent"
                round
                dense
                :icon="expandedDispensers.includes(props.rowIndex) ? 'remove' : 'add'"
                @click="toggleDispenserRow(props.rowIndex)"
                @click.stop
              />
            </QTd>
            <QTd
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              <span v-if="col.field === 'dispenserType'">
                {{ dispenserTypes?.find(type => type.dispenserTypeId === col.value)?.dispenserTypeName }}
              </span>
              <span v-else>
                {{ col.value }}
              </span>
            </QTd>
          </QTr>
          <QTr
            v-if="expandedDispensers.includes(props.rowIndex)"
            :props="props"
          >
            <QTd colspan="100%">
              <div class="text-left">
                Last Consumption Control: {{ props.row.lastConsumptionControl }},
                Read Consumption from DMS: {{ props.row.readConsumptionFromDMS }},
                FileName: {{ props.row.consumptionFilename }},
                FilePath: {{ props.row.filePath }}
              </div>
            </QTd>
          </QTr>
        </template>
      </QTable>
    </div>

    <div class="q-pa-md">
      <QCard bordered>
        <QCardSection class="flex justify-center items-center">
          <QBtn
            :label="innerWidth > minSize ? t('AddNewMachine') : ''"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 h-12 overflow-hidden"
            style="white-space: nowrap; text-overflow: ellipsis;"
            clickable
            @click="handleNewMachine"
          >
            <QTooltip
              v-if="innerWidth <= minSize"
              :offset="[10, 10]"
            >
              {{ t('AddNewMachine') }}
            </QTooltip>
          </QBtn>
          <TeleskopSyncBtn
            type="Machines"
            :min-size="1400"
            @click="refreshMachines"
          />
        </QCardSection>
      </QCard>

      <QTable
        v-model:pagination="machinePagination"
        :title="t('Machines')"
        :rows="machines"
        :columns="machineColumns"
        row-key="name"
        separator="cell"
        virtual-scroll
        style="height: 700px"
        flat
        bordered
        :on-row-click="onMachineClick"
      >
        <template #header="props">
          <QTr :props="props">
            <QTh auto-width />
            <QTh
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </QTh>
          </QTr>
        </template>

        <template #body="props">
          <QTr
            :props="props"
            style="cursor:pointer"
            @click="onMachineClick(props.row)"
          >
            <QTd auto-width>
              <QBtn
                size="sm"
                color="accent"
                round
                dense
                :icon="expandedMachines.includes(props.rowIndex) ? 'remove' : 'add'"
                @click="toggleMachineRow(props.rowIndex)"
                @click.stop
              />
            </QTd>
            <QTd
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              <span v-if="col.field === 'connectedDispensers'">
                {{ props.row.connectedDispensers?.map((connection: any) => connection.dispenserName).filter(Boolean).join(', ') || '-' }}
              </span>
              <span v-else>
                {{ col.value }}
              </span>
            </QTd>
          </QTr>
          <QTr v-show="expandedMachines.includes(props.rowIndex)">
            <QTd :colspan="props.cols.length + 1" class="q-pa-none">
              <div style="width: 100%">
                <QTable
                  :rows="props.row.tanks"
                  :columns="[
                    { name: 'tankNo', label: t('machineFields.TankNo'), field: 'tankNo', align: 'left' },
                    { name: 'tankName', label: t('machineFields.TankName'), field: 'tankName', align: 'left' },
                    { name: 'tankCap', label: t('machineFields.TankCap'), field: 'tankCap', align: 'left' },
                  ]"
                  flat
                  bordered
                  dense
                  row-key="tankNo"
                  class="q-mt-sm"
                  hide-bottom
                >
                  <template #body="tankProps">
                    <QTr
                      :props="tankProps"
                      style="cursor:pointer"
                      @click.stop="onTankClick(props.row.machineId, props.row.tanks, tankProps.row.tankNo, false)"
                    >
                      <QTd>{{ tankProps.row.tankNo }}</QTd>
                      <QTd>{{ tankProps.row.tankName }}</QTd>
                      <QTd>{{ tankProps.row.tankCap }}</QTd>
                    </QTr>
                  </template>
                </QTable>
                <QBtn
                  w-full
                  rounded
                  m-2
                  icon="add"
                  @click="onTankClick(props.row.machineId, props.row.tanks, props.row.tanks.length > 0 ? props.row.tanks[props.row.tanks.length - 1].tankNo + 1 : 1, true)"
                >
                  <QTooltip :offset="[0, 5]">
                    {{ t('machineFields.AddNewTank') }}
                  </QTooltip>
                </QBtn>
              </div>
            </QTd>
          </QTr>
        </template>
      </QTable>
    </div>
  </div>
</template>
