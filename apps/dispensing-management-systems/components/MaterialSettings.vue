<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import MaterialInfo from './MaterialInfo.vue'
import type { Material } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const materials = ref([])
getMaterials()
async function getMaterials() {
  materials.value = await $fetch('/api/materials/materials')
}
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
    label: t('materialFields.GroupNo'),
    field: 'materialGroupNo',
    sortable: true,
    align: 'left',
  },
]

async function onRowClick(_event: Event, row: any) {
  const selectedMaterial = await $fetch(`/api/materials/${row.materialCode}`)
  q.dialog({
    component: MaterialInfo,
    componentProps: { material: selectedMaterial },
  })
}
</script>

<template>
  <QTable
    flat
    bordered
    class="mt-10"
    separator="cell"
    :columns="columns"
    :rows="materials"
    row-key="name"
    @row-click="onRowClick"
  />
</template>

<style scoped lang="postcss">

</style>
