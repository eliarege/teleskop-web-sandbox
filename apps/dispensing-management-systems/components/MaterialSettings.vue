<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MaterialInfo from './MaterialInfo.vue'
import type { Material, MaterialGroup } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const { data: materials, refresh: refreshMaterials } = await useFetch<Material[]>('/api/materials')

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
]

async function onRowClick(_event: Event, row: any) {
  const selectedMaterial = await $fetch(`/api/materials/${row.materialCode}`)
  q.dialog({
    component: MaterialInfo,
    componentProps: {
      material: selectedMaterial,
      groupOptions,
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
        <span v-else>
          {{ props.value }}
        </span>
      </QTd>
    </template>
  </QTable>
</template>

<style>
.table-header th {
  font-weight: bold;
  color: white;
  text-decoration: underline;
  position: sticky;
  background-color: var(--q-primary);
  top: 0px;
  z-index: 1;
}
</style>
