<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MaterialInfo from '../material/MaterialInfo.vue'
import type { Material, MaterialGroup } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const dataStore = useDataStore()

const { data: materials, refresh: refreshMaterials } = await useFetch<Material[]>('/api/materials')
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
const columns: (QTableColumn<Material>)[] = [
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
  {
    name: 'connectedDispensers',
    label: t('materialFields.ConnectedDispensers'),
    field: 'connectedDispensers',
    align: 'left',
  },
]
async function onRowClick(_event: Event, row: any) {
  const selectedMaterial = await $fetch(`/api/materials/${row.materialCode}`)
  q.dialog({
    component: MaterialInfo,
    componentProps: {
      material: selectedMaterial,
      groupOptions,
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
      refreshMaterials()
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
function addNewMaterial() {
  q.dialog({
    component: MaterialInfo,
    componentProps: {
      groupOptions,
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
      refreshMaterials()
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
    {{ t('settings.Material') }}
  </div>
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
      link="/api/teleskop/sync/materials"
      :min-size="800"
      @click="refreshMaterials"
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
    :rows="materials"
    row-key="name"
    @row-click="onRowClick"
  >
    <template #body-cell="props">
      <QTd
        :props="props"
      >
        <span v-if="props.col.field === 'materialGroupNo'">
          {{ groupOptions.at(props.value - 1)?.materialGroupName }}
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
