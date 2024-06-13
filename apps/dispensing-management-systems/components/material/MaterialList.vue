<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Material } from '~/shared/types'

const { data: materials } = useFetch<Material[]>('/api/materials')

</script>

<template>
  <draggable
    v-model="materials"
    class="draggable-area ml-2"
    item-key="materialCode"
    ghost-class="material-ghost"
    :group="{ name: 'materials', pull: 'clone', put: false }"
    :clone="(item: any) => ({ ...item })"
    :sort="false"
  >
    <template #item="{ element, index }">
      <div class="material-item">
        {{ index + 1 }} - {{ element.materialName }}
      </div>
    </template>
  </draggable>
</template>
