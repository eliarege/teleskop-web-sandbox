<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MaterialInfoDialog from '../material/MaterialInfoDialog.vue'
import type { Material, MaterialGroup } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const filters = ref([])
const { data: materials, refresh: refreshMaterials } = await useFetch<Material[]>('/api/materials/filtered', { method: 'POST', body: { filters: filters.value } })
const dispensers = await dataStore.getDispensers()
const searchFilter = ref('')
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
const columns = ref([
  {
    name: 'materialCode',
    label: t('materialFields.Code'),
    field: 'materialCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialName',
    label: t('materialFields.Name'),
    field: 'materialName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialGroupNo',
    label: t('materialFields.Group'),
    field: 'materialGroupNo',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: groupOptions,
    optionLabel: 'materialGroupName',
    optionValue: 'materialGroupNo',
  },
  {
    name: 'connectedDispensers',
    label: t('materialFields.ConnectedDispensers'),
    field: 'connectedDispensers',
    align: 'left',
    filterable: true,
    filterType: 'multiselect',
    selectionOptions: dispensers,
    optionLabel: 'dispenserName',
    optionValue: 'dispenserId',
  },
])

async function onRowClick(row: any) {
  const selectedMaterial = await $fetch(`/api/materials/${row.materialCode}`)
  q.dialog({
    component: MaterialInfoDialog,
    componentProps: {
      material: selectedMaterial,
      groupOptions,
      dispensers,
    },
  }).onOk((payload) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMaterials()
    } else
      notifyFail(t('Failed'))
  },
  )
}
function addNewMaterial() {
  q.dialog({
    component: MaterialInfoDialog,
    componentProps: {
      groupOptions,
      dispensers,
    },
  }).onOk((payload) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMaterials()
    } else
      notifyFail(t('Failed'))
  },
  )
}
function customFilter(rows: Material[], terms: string) {
  terms = terms.toLowerCase()
  return rows.filter((row) => {
    const materialCodeMatches = row.materialCode.toLowerCase().includes(terms)
    const materialNameMatches = row.materialName.toLowerCase().includes(terms)
    const materialGroupMatches = String(groupOptions.at(row.materialGroupNo - 1)?.materialGroupName).toLowerCase().includes(terms)
    const connectedDispensersMatches = row.connectedDispensers.some(dispenser => dispenser.dispenserName.toLowerCase().includes(terms))
    return materialCodeMatches || materialNameMatches || materialGroupMatches || connectedDispensersMatches
  })
}
async function handleFilterSlotsUpdate(updatedFilters: any) {
  filters.value = updatedFilters
}
const pagination = ref({ rowsPerPage: 50 })
</script>

<template>
  <div class="flex-center text-xl">
    {{ t('settings.Material') }}
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <QInput
    v-model="searchFilter"
    :label="t('Search')"
    class="ml-10 mr-10 mb-5"
  >
    <template #prepend>
      <QIcon name="search" />
    </template>
  </QInput>
  <div class="flex-center mb-4">
    <QBtn
      :label="$t('AddNewMaterial')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12 mr-2"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="addNewMaterial"
    />
    <TeleskopSyncBtn
      class="ml-2"
      type="Materials"
      :min-size="800"
      @click="refreshMaterials"
    />
  </div>
  <FilterableTable
    :rows="materials"
    :columns
    class="h-160 custom-filterable-table"
    :is-virtual-scroll="false"
    :pagination
    @update-filter-slots="handleFilterSlotsUpdate"
  >
    <template #custombody="props">
      <QTr
        :props="props"
        style="cursor: pointer;"
        @click="onRowClick(props.row)"
      >
        <QTd
          v-for="col in props.cols"

          :key="col.name"
          :props="props"
        >
          <span v-if="col.field === 'materialGroupNo'">
            {{ groupOptions.at(props.row[col.field] - 1)?.materialGroupName }}
          </span>
          <span v-else-if="col.field === 'connectedDispensers'">
            {{ props.row.connectedDispensers?.map((connection: any) => connection.dispenserName).filter(Boolean).join(', ') || '-' }}
          </span>
          <span v-else>
            {{ props.row[col.field] }}
          </span>
        </QTd>
      </qtr>
    </template>
  </FilterableTable>
</template>
