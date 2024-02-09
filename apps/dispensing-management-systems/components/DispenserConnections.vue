<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { Machine, Material, MaterialGroup } from '~/shared/types'

const props = defineProps({
  dispenserId: {
    type: Number,
    required: true,
  },
})

const { t } = useI18n()
const q = useQuasar()
const tab = ref()
const machines = ref<Machine[]>([])
const selectedMachines = ref<number[]>([])
const materials = ref<Material[]>([])
const selectedMaterials = ref<Material[]>([])

watch((tab), async (tab) => {
  if (tab === 'machines') {
    machines.value = await $fetch('/api/machines')
    const tempSelected: Machine[] = await $fetch(`/api/dispensers/connections/machines/${props.dispenserId}`)
    selectedMachines.value = []
    tempSelected.forEach(machine =>
      selectedMachines.value.push(machine.machineId),
    )
  } else if (tab === 'materials') {
    materials.value = await $fetch('/api/materials')
    const tempSelected: Material[] = await $fetch(`/api/dispensers/connections/materials/${props.dispenserId}`)
    selectedMaterials.value = []
    tempSelected.forEach(material =>
      selectedMaterials.value.push(material),
    )
  }
})
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
function updateSelectedMaterials(selectedRows: any) {
  selectedMaterials.value = selectedRows
}
function getRows(rows: number) {
  return `${rows} Selected`
}
async function handleSubmit() {

}
async function handleReset() {
  if (tab.value === 'machines') {
    const tempSelected: Machine[] = await $fetch(`/api/dispensers/connections/machines/${props.dispenserId}`)
    selectedMachines.value = []
    tempSelected.forEach(machine =>
      selectedMachines.value.push(machine.machineId),
    )
  } else if (tab.value === 'materials') {
    const tempSelected: Material[] = await $fetch(`/api/dispensers/connections/materials/${props.dispenserId}`)
    selectedMaterials.value = []
    tempSelected.forEach(material =>
      selectedMaterials.value.push(material),
    )
  }
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
          name="machines" icon="video_label" :label="t('Machines')" no-caps
          :class="tab === 'machines' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
        />
        <QSeparator vertical />
        <QTab
          name="materials" icon="science" :label="t('Materials')" no-caps
          :class="tab === 'materials' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
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
        />
      </div>
    </div>
    <div v-if="tab === 'materials'">
      <QTable
        flat
        bordered
        table-header-class="table-header"
        table-class="max-h-150"
        separator="cell"
        :pagination
        :columns="materialColumns"
        :rows="materials"
        row-key="materialCode"
        selection="multiple"
        :selected="selectedMaterials"
        :selected-rows-label="getRows"
        @update:selected="updateSelectedMaterials"
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
      <QBtn :label="t('Save')" icon="save" color="primary" @click="handleSubmit" />
      <QBtn :label="t('Reset')" icon="refresh" @click="handleReset" />
    </div>
  </div>
</template>

<style lang="postcss">
/* Light Theme */
.tabs-light {
  background-color: white;
  white-space: normal;
  color: black
}

.tabs-light-active {
  background-color: black;
  white-space: normal;
  color: white
}
/* Dark Theme */
.tabs-dark {
  background-color: black;
  white-space: normal;
  color: white
}

.tabs-dark-active {
  background-color: white;
  white-space: normal;
  color: black
}
.tabs-border {
  border: 1px;
  border-style: solid;
  border-color: rgba(128,128,128,0.5);
}
.q-tab .q-tab__label {
  font-weight: bold;
  font-size: 1.1rem;
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
