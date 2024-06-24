<script setup lang="ts">
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Material } from '~/shared/types'

const { t } = useI18n()

const { data: materials } = useFetch<Material[]>('/api/materials')

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
    hide-header
    mb-2
  >
    <template #body="props">
      <draggable
        :list="[props.row]"
        :group="{ name: 'materials', pull: 'clone', put: false }"
        :clone="cloneMaterial"
        :sort="false"
        ghost-class="material-ghost"
      >
        <template #item="{ element }">
          <q-tr>
            <q-td key="drag-handle">
              <q-icon name="drag_handle" class="drag-handle" />
            </q-td>
            <q-td
              v-for="col in columns"
              :key="col.name"
              :props
              class="cursor-pointer"
            >
              {{ element[col.name] }}
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
