<script setup lang="ts">
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Material } from '~/shared/types'

const { t } = useI18n()

const { data: materials } = useFetch<Material[]>('/api/materials')
const materialSearchFilter = ref('')

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
  <QTable
    :columns
    :rows="materials"
    :filter="materialSearchFilter"
    row-key="materialCode"
    h-95
    mb-2
  >
    <template #header="props">
      <QInput
        v-model="materialSearchFilter"
        :label="t('Search')"
        class="mx-5 mb-5"
      >
        <template #prepend>
          <QIcon name="search" />
        </template>
      </QInput>
    </template>
    <template #body="props">
      <draggable
        :list="[props.row]"
        :group="{ name: 'materials', pull: 'clone', put: false }"
        :clone="cloneMaterial"
        :sort="false"
        ghost-class="material-ghost"
      >
        <template #item="{ element }">
          <QTr>
            <QTd key="drag-handle">
              <QIcon name="drag_handle" class="drag-handle" />
            </QTd>
            <QTd
              v-for="col in columns"
              :key="col.name"
              :props
              class="cursor-pointer"
              :style="col.name === 'materialCode' ? 'width: 100px;' : ''"
            >
              {{ element[col.name] }}
            </QTd>
          </QTr>
        </template>
      </draggable>
    </template>
  </QTable>
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
