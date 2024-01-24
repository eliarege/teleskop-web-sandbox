<script lang="ts" setup>
import type { QTableColumn } from 'quasar'
import type { Dispenser, Machine } from '~/shared/types'

const { t } = useI18n()

const dispenserColumns: (QTableColumn<Dispenser>)[] = [
  {
    name: 'id',
    required: true,
    label: t('Dispenser Number'),
    align: 'center',
    field: 'dispenserId',
    format: val => `${val}`,
    sortable: true,
  },
  { name: 'name', label: t('Dispenser Name'), align: 'center', field: 'dispenserName', sortable: true },
  { name: 'ip', label: t('Dispenser IP'), field: 'dispenserIP' },
  { name: 'type', label: t('Dispenser Type'), field: 'dispenserType' },
  { name: 'protocol', label: t('Protocol'), field: 'protocol' },
  // { name: 'last_consumption_control', label: t('Last Consumption Control'), field: 'lastConsumptionControl' },
  // { name: 'read_consumption_from_dms', label: t('Read Consumption from DMS'), field: 'readConsumptionFromDMS', sortable: true },
  // { name: 'consumption_filename', label: t('Consumption Filename'), field: 'consumptionFilename' },
  // { name: 'bdy_requestname', label: t('Body Request Name'), field: 'bdyRequestName' },
  // { name: 'bdy_requestpath', label: t('Body Request Path'), field: 'bdyRequestPath' },

]

const machineColumns: (QTableColumn<Machine>)[] = [
  {
    name: 'id',
    required: true,
    label: t('Machine Number'),
    align: 'center',
    field: 'machineId',
    format: val => `${val}`,
    sortable: false,
  },
  { name: 'name', label: t('Machine Name'), align: 'center', field: 'machineName', sortable: true },
  { name: 'controllertype', label: t('Controller Type'), align: 'center', field: 'controllerType', sortable: true },

]
const { data: dispenserRows } = await useFetch(`/api/dispensers/dispensers`)
const { data: machineRows } = await useFetch(`/api/machines/machines`)

async function addDispenser(newDispenser: Dispenser) {
  await $fetch('/api/dispensers/dispensers/post', { method: 'POST', body: newDispenser })
}

async function addMachine(newMachine: Machine) {
  await $fetch('/api/machines/machines/post', { method: 'POST', body: newMachine })
}

async function handleNewDispenser(newDispenser: Dispenser) {
  await addDispenser(newDispenser)
  dispenserRows = await useFetch(`/api/dispensers/dispensers`)
  console.log('dispenser')
}

async function handleNewMachine(newMachine: Machine) {
  await addMachine(newMachine)
  machineRows = await useFetch(`/api/machines/machines`)
  await useFetch(`/api/machines/machines`)
  console.log('machine')
}

const expandedDispensers = ref<number[]>([])
const expandedMachines = ref<number[]>([])

function toggleDispenserRow(id: number) {
  console.log(id)
  if (!expandedDispensers.value.includes(id)) {
    expandedDispensers.value.push(id)
  } else {
    const index = expandedDispensers.value.indexOf(id)
    expandedDispensers.value.splice(index, 1)
  }
  console.log(expandedDispensers.value)
}

function toggleMachineRow(id: number) {
  console.log(id)
  if (!expandedMachines.value.includes(id)) {
    expandedMachines.value.push(id)
  } else {
    const index = expandedMachines.value.indexOf(id)
    expandedMachines.value.splice(index, 1)
  }
  console.log(expandedMachines.value)
}

const myPagination = ref({ rowsPerPage: 14 })
</script>

<template>
  <div
    h-full
    flex
    place-content-center
    all:transition-400
  >
    <div class="q-pa-md">
      <q-card class="flex flex-column justify-between" bordered>
        <q-card-section class="flex items-center">
          <q-btn
            :label="$t('New')"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 ml-2"
            clickable
            @click="handleNewDispenser()"
          />
        </q-card-section>
      </q-card>

      <q-table
        v-model:pagination="myPagination"
        title="Dispensers"
        :rows="dispenserRows"
        :columns="dispenserColumns"
        separator="cell"
        auto-width="true"
        loading="true"
        virtual-scroll
        style="height: 600px"
        flat
        bordered
      >
        <template #header="props">
          <q-tr :props="props">
            <q-th auto-width />
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-btn
                size="sm"
                color="accent"
                round
                dense
                :icon="expandedDispensers.includes(props.rowIndex) ? 'remove' : 'add'"
                @click="toggleDispenserRow(props.rowIndex)"
              />
            </q-td>
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.value }}
            </q-td>
          </q-tr>
          <q-tr
            v-if="expandedDispensers.includes(props.rowIndex)"
            :props="props"
          >
            <q-td colspan="100%">
              <div class="text-left">
                {{ props.row.dispenserId }}.
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div class="q-pa-md ">
      <q-card class="flex flex-row justify-between" bordered>
        <q-card-section class="flex items-center">
          <q-btn
            :label="$t('New')"
            no-caps
            icon="note_add"
            color="primary"
            class="mr-4 ml-2"
            @click="handleNewMachine()"
          />
        </q-card-section>
      </q-card>

      <q-table
        v-model:pagination="myPagination"
        title="Machines"
        :rows="machineRows"
        :columns="machineColumns"
        row-key="name"
        separator="cell"
        auto-width="true"
        virtual-scroll
        style="height: 600px"
        flat
        bordered
      >
        <template #header="props">
          <q-tr :props="props">
            <q-th auto-width />
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-btn
                size="sm"
                color="accent"
                round
                dense
                :icon="expandedMachines.includes(props.rowIndex) ? 'remove' : 'add'"
                @click="toggleMachineRow(props.rowIndex)"
              />
            </q-td>
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.value }}
            </q-td>
          </q-tr>
          <q-tr v-if="expandedMachines.includes(props.rowIndex)">
            <q-td colspan="100%">
              <div class="text-left">
                This is expand slot for row above: {{ props.row.name }}.
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </div>
</template>
