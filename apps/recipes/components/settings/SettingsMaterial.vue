<script setup lang="ts">
import type { QTableProps } from 'quasar'
import MaterialInfoDialog from '../material/MaterialInfoDialog.vue'
import type { Dispenser, Material, MaterialGroup } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const filters = ref([])
const { data: materials, refresh: refreshMaterials } = await useFetch<Material[]>('/api/materials/filtered', { method: 'POST', body: { filters: filters.value } })
const dispensers = await dataStore.getDispensers()
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
  const selectedMaterial = await $fetch(`/api/materials/${encodeURIComponent(row.materialCode)}`)
  q.dialog({
    component: MaterialInfoDialog,
    componentProps: {
      material: selectedMaterial,
      groupOptions,
      dispensers,
    },
  }).onOk((payload: any) => {
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
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshMaterials()
    } else
      notifyFail(t('Failed'))
  },
  )
}
async function handleFilterSlotsUpdate(updatedFilters: any) {
  const connectedDispensers = new Set()
  const otherFilters = updatedFilters.filter((filter: any) => {
    if (filter.field === 'connectedDispensers') {
      filter.value.option.forEach((dispenser: Dispenser) => {
        connectedDispensers.add(dispenser.dispenserId)
      })
      return false
    }
    return true
  })
  filters.value = otherFilters
  materials.value = (await $fetch('/api/materials/filtered', { method: 'POST', body: { filters: filters.value } }))
    .filter((row: any) => {
      const connectedDispensersArray = Array.from(connectedDispensers)
      return connectedDispensersArray.every((dispenser: any) => {
        return row.connectedDispensers.some((connectedDispenser: any) => {
          return connectedDispenser.dispenserId === dispenser
        })
      })
    })
}
const pagination = ref({ rowsPerPage: 50 } as QTableProps['pagination'])
</script>

<template>
  <div class="flex flex-row align-start justify-center">
    <div class="text-xl">
      {{ t('settings.Material') }}
    </div>
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <div class="flex justify-center items-center mb-4">
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
    v-model:pagination="pagination"
    :rows="materials"
    :columns
    class="page-table custom-filterable-table"
    :is-virtual-scroll="false"
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
