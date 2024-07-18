<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import CopyConnectionsDialog from '../CopyConnectionsDialog.vue'
import type { Machine, Material, MaterialGroup } from '~/shared/types'

const props = defineProps({
  dispenserId: {
    type: Number,
    required: true,
  },
})

const { t } = useI18n()
const q = useQuasar()
const { notifySuccess, notifyFail } = useNotify()
const tab = ref('machines')
const buttonDisabled = ref(true)

const machines = ref<Machine[]>([])
const selectedMachinesInitial = ref<Machine[]>([])
const selectedMachines = ref<number[]>([])

const materials = ref<Material[]>([])
const selectedMaterialsInitial = ref<Material[]>([])
const selectedMaterials = ref<Material[]>([])
const materialSearchFilter = ref('')
watch((tab), async (tab) => {
  if (tab === 'machines') {
    machines.value = await $fetch('/api/machines')
    selectedMachinesInitial.value = await $fetch(`/api/connections/machines/${props.dispenserId}`)
    selectedMachines.value = []
    selectedMachinesInitial.value.forEach(machine =>
      selectedMachines.value.push(machine.machineId),
    )
  } else if (tab === 'materials') {
    materials.value = await $fetch('/api/materials')
    selectedMaterialsInitial.value = await $fetch(`/api/connections/materials/${props.dispenserId}`)
    selectedMaterials.value = []
    selectedMaterialsInitial.value.forEach(material =>
      selectedMaterials.value.push(material),
    )
  }
  buttonDisabled.value = true
}, { immediate: true })
const groupOptions: MaterialGroup[] = [{
  materialGroupNo: 1,
  materialGroupName: t('materialTypes.1'),
}, {
  materialGroupNo: 2,
  materialGroupName: t('materialTypes.2'),
}, {
  materialGroupNo: 3,
  materialGroupName: t('materialTypes.3'),
}]
const materialColumns: (QTableColumn<Material>)[] = [
  {
    name: 'materialCode',
    label: t('materialFields.Code'),
    field: 'materialCode',
    sortable: true,
    align: 'left',
  },
  {
    name: 'materialName',
    label: t('materialFields.Name'),
    field: 'materialName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'materialGroupNo',
    label: t('materialFields.Group'),
    field: 'materialGroupNo',
    sortable: true,
    align: 'left',
  },
]
function onMaterialSelected(selectEvent: any) {
  if (selectEvent.added) {
    selectEvent.rows.forEach((row: any) => {
      selectedMaterials.value.push(row)
    },
    )
  } else {
    selectEvent.rows.forEach((row: any) => {
      selectedMaterials.value = selectedMaterials.value.filter(material => material.materialCode !== row.materialCode)
    })
  }
  buttonDisabled.value = false
}
function onMachineSelected() {
  buttonDisabled.value = false
}
function getRows(rows: number) {
  return t('SelectedMaterials', { count: rows })
}
async function handleSubmit() {
  if (tab.value === 'machines') {
    const added = selectedMachines.value
      .filter(machineId =>
        !selectedMachinesInitial.value.some(initialMachine => initialMachine.machineId === machineId))

    const deleted = selectedMachinesInitial.value
      .filter(initialMachine =>
        !selectedMachines.value.includes(initialMachine.machineId))
      .map(deletedMachine => deletedMachine.machineId)

    try {
      buttonDisabled.value = true
      await $fetch(`/api/connections/machines/${props.dispenserId}`, { method: 'POST', body: {
        added,
        deleted,
      } })
      notifySuccess(t('Success'))
      selectedMachinesInitial.value = selectedMachines.value.map((machineId) => {
        const machine = machines.value.find(machine => machine.machineId === machineId)
        return machine ? { ...machine } : []
      }).filter(Boolean)
    } catch (e) {
      notifyFail(t('Failed'))
      buttonDisabled.value = false
    }
  } else if (tab.value === 'materials') {
    const added = selectedMaterials.value
      .filter(material =>
        !selectedMaterialsInitial.value.some(initialMaterial => initialMaterial.materialCode === material.materialCode))
      .map(addedMaterial => addedMaterial.materialCode)

    const deleted = selectedMaterialsInitial.value
      .filter(initialMaterial =>
        !selectedMaterials.value.some(material => material.materialCode === initialMaterial.materialCode))
      .map(deletedMaterial => deletedMaterial.materialCode)
    try {
      buttonDisabled.value = true
      await $fetch(`/api/connections/materials/${props.dispenserId}`, { method: 'POST', body: {
        added,
        deleted,
      } })
      notifySuccess(t('Success'))
      selectedMaterialsInitial.value = selectedMaterials.value
    } catch (e) {
      notifyFail(t('Failed'))
      buttonDisabled.value = false
    }
  }
}
function handleReset() {
  if (tab.value === 'machines') {
    selectedMachines.value = []
    selectedMachinesInitial.value.forEach(machine =>
      selectedMachines.value.push(machine.machineId),
    )
  } else if (tab.value === 'materials') {
    selectedMaterials.value = []
    selectedMaterialsInitial.value.forEach(material =>
      selectedMaterials.value.push(material),
    )
  }
  buttonDisabled.value = true
}
function handleCopy() {
  q.dialog({
    component: CopyConnectionsDialog,
    componentProps: {
      type: tab.value,
      dispenserId: Number(props.dispenserId),
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
    } else
      notifyFail(t('Failed'))
  })
}
function materialFilter(rows: Material[], terms: string) {
  terms = terms.toLowerCase()
  return rows.filter((row) => {
    const materialCodeMatches = row.materialCode.toLowerCase().includes(terms)
    const materialNameMatches = row.materialName.toLowerCase().includes(terms)
    const materialGroupMatches = String(groupOptions.at(row.materialGroupNo - 1)?.materialGroupName).toLowerCase().includes(terms)
    const connectedDispensersMatches = row.connectedDispensers?.some(dispenser => dispenser.dispenserName.toLowerCase().includes(terms))
    return materialCodeMatches || materialNameMatches || materialGroupMatches || connectedDispensersMatches
  })
}
const pagination = ref({ rowsPerPage: 100 })
</script>

<template>
  <div class="q-pa-md">
    <div class="q-gutter-y-md">
      <QTabs
        v-model="tab"
        class="tabs-border"
        dense
        align="justify"
        :breakpoint="0"
      >
        <QTab
          name="machines"
          icon="video_label"
          :label="t('Machines')"
          no-caps
          :class="tab === 'machines' ? 'tabs-active' : 'tabs'"
        />
        <QSeparator vertical />
        <QTab
          name="materials"
          icon="science"
          :label="t('Materials')"
          no-caps
          :class="tab === 'materials' ? 'tabs-active' : 'tabs'"
        />
      </QTabs>
    </div>
    <div v-if="tab === 'machines'">
      <div class=" grid-container">
        <QCheckbox
          v-for="machine in machines"
          :key="machine.machineId"
          v-model="selectedMachines"
          class="grid-item"
          :label="machine.machineName"
          :val="machine.machineId"
          @update:model-value="onMachineSelected"
        />
      </div>
    </div>
    <div v-if="tab === 'materials'">
      <QInput
        v-model="materialSearchFilter"
        :label="t('Search')"
        class="ml-10 mr-10 mb-5"
      >
        <template #prepend>
          <QIcon name="search" />
        </template>
      </QInput>
      <QTable
        flat
        bordered
        class="mt-5"
        table-header-class="table-header"
        table-class="max-h-140"
        separator="cell"
        :pagination
        :filter="materialSearchFilter"
        :filter-method="materialFilter"
        :columns="materialColumns"
        :rows="materials"
        row-key="materialCode"
        selection="multiple"
        :selected="selectedMaterials"
        :selected-rows-label="getRows"
        @selection="onMaterialSelected"
      >
        <template #body-cell="tableProps">
          <QTd
            :props="tableProps"
          >
            <span v-if="tableProps.col.field === 'materialGroupNo'">
              {{ groupOptions.at(tableProps.value - 1)?.materialGroupName }}
            </span>
            <span v-else>
              {{ tableProps.value }}
            </span>
          </QTd>
        </template>
      </QTable>
    </div>
    <div v-if="tab" class="flex-center gap-10 mt-10">
      <QBtn
        :label="t('Save')"
        icon="save"
        color="primary"
        :disable="buttonDisabled"
        @click="handleSubmit"
      />
      <QBtn
        :label="t('Reset')"
        icon="refresh"
        @click="handleReset"
      />
      <QBtn
        :label="t('CopyConnections')"
        color="secondary"
        icon="link"
        @click="handleCopy"
      />
    </div>
  </div>
</template>

<style lang="postcss">
.tabs-border {
  border: 1px;
  border-style: solid;
  border-color: rgba(128,128,128,0.5);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Two columns per row */
  gap: 16px; /* Adjust gap between grid items */
  max-height: calc(80vh - 100px); /* Set maximum height for the grid container */
  overflow-y: auto; /* Enable vertical scrolling if content exceeds container height */
  margin-top: 20px;
}
.button-container {
  display: flex;
  justify-content: space-between; /* Center the button horizontally */
  margin-top: 20px; /* Add margin for spacing */
}
.grid-item {
  width: 100%; /* Each grid item occupies full width of its column */
  padding-left: 10px; /* Use the dynamically calculated padding */
  display: flex;
  align-items: center; /* Center the items vertically */
}
</style>
