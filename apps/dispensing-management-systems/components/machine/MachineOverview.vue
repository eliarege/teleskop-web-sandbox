<script lang="ts" setup>
import { QCardSection } from 'quasar'
import type { QTableColumn } from 'quasar'
import DispenserEdit from '../dispenser/DispenserEdit.vue'
import MachineInfo from './MachineInfo.vue'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserType, Machine, MachineControllerType } from '~/shared/types'

const { t } = useI18n()
const q = useQuasar()
const { notifySuccess, notifyFail } = useNotify()

const dataStore = useDataStore()

await dataStore.getDispensers()
const { data: controllerTypes } = useFetch<MachineControllerType[]>('/api/machines/types')
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
    label: t('machineFields.No'),
    align: 'center',
    field: 'machineId',
    format: val => `${val}`,
    sortable: true,
  },
  { name: 'machinename', label: t('machineFields.Name'), align: 'center', field: 'machineName', sortable: true },
  { name: 'controllertype', label: t('machineFields.ControllerType'), align: 'center', field: 'controllerType', sortable: true },

]
const { data: machineRows, refresh: refreshMachines } = await useFetch(`/api/machines`)

async function handleNewDispenser() {
  q.dialog({
    component: DispenserEdit,
  }).onOk(() => {
    refreshDispensers()
    notifySuccess(t('Success'))
  })
}

async function handleNewMachine() {
  q.dialog({
    component: MachineInfo,
    componentProps: {
      controllerTypes: controllerTypes.value,
      dispensers: dataStore.dispensers,
    },
  }).onOk((payload) => {
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
    component: DispenserEdit,
    componentProps: { dispenser: row },
  }).onOk(() => {
    refreshDispensers()
    notifySuccess(t('Success'))
  })
}
async function onMachineClick(row: any) {
  const selectedMachine = await $fetch(`/api/machines/${row.machineId}`)
  q.dialog({
    component: MachineInfo,
    componentProps: {
      machine: selectedMachine,
      controllerTypes: controllerTypes.value,
      dispensers: dataStore.dispensers,
    },
  }).onOk((payload) => {
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
      <QCard class="flex-center" bordered>
        <QCardSection class="flex-center items-center">
          <QBtn
            :label="innerWidth > minSize ? $t('AddNewDispenser') : ''"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 ml-2 h-12 overflow-hidden"
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
            class="mr-4 ml-2"
            type="Dispensers"
            :min-size="1400"
            @click="refreshDispensers"
          />
        </QCardSection>
      </QCard>

      <QTable
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
    <div class="q-pa-md ">
      <QCard class="flex-center" bordered>
        <QCardSection class="flex-center items-center">
          <QBtn
            :label="innerWidth > minSize ? $t('AddNewMachine') : ''"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 ml-2 h-12 overflow-hidden"
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
            class="mr-4 ml-2"
            type="Machines"
            :min-size="1400"
            @click="refreshMachines"
          />
        </QCardSection>
      </QCard>

      <QTable
        v-model:pagination="machinePagination"
        :title="t('Machines')"
        :rows="machineRows"
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
              <span v-if="col.field === 'controllerType'">
                {{ controllerTypes?.find(type => type.controllerTypeId === col.value)?.controllerTypeName }}
              </span>
              <span v-else>
                {{ col.value }}
              </span>
            </QTd>
          </QTr>
          <QTr v-if="expandedMachines.includes(props.rowIndex)">
            <QTd colspan="100%">
              <div class="text-left">
                This is expand slot for row above: {{ props.row.name }}.
              </div>
            </QTd>
          </QTr>
        </template>
      </QTable>
    </div>
  </div>
</template>
