<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Material } from '~/shared/types'

const { t } = useI18n()

const materials = ref<Material[][]>([
  { materialCode: 'ABC', materialName: 'ABC KİMYASALI' },
  { materialCode: 'XYZ', materialName: 'XYZ BOYASI' },
  { materialCode: 'DEF', materialName: 'DEF BOYASI' },
])

const columns = [
  {
    name: 'materialCode',
    required: true,
    label: t('materialFields.Code'),
    align: 'left',
    field: 'materialCode',
    sortable: true,
  },
  {
    name: 'materialName',
    required: true,
    label: t('materialFields.Name'),
    align: 'left',
    field: 'materialName',
    sortable: true,
  },
]

function cloneMaterial(material: Material) {
  return { ...material }
}
</script>

<template>
  <q-table
    :rows="materials"
    :columns
    row-key="materialCode"
    flat
  >
    <template #body="props">
      <draggable
        :list="[props.row]"
        item-key="materialCode"
        :group="{ name: 'materials', pull: 'clone', put: false }"
        :clone="cloneMaterial"
        :sort="false"
        ghost-class="material-ghost"
      >
        <template #item>
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              class="drag-handle"
              :props="props"
            >
              {{ col.value }}
            </q-td>
          </q-tr>
        </template>
      </draggable>
    </template>
  </q-table>
</template>

<style scoped>
.drag-handle {
  cursor: move;
}

.material-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
