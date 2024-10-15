<script setup lang="ts">
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Material } from '~/shared/types'

const p = defineProps({
  isDraggable: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['materialSelected', 'close'])
const { t } = useI18n()
const materials = ref<Material[]>([])
const selectedMaterial = ref<Material | null>(null)
const materialSearchFilter = ref('')
const type = ref<number>(0)
defineExpose({
  type,
})

getMaterials()
async function getMaterials() {
  materials.value = await $fetch('/api/materials')
}

const filteredMaterials = computed(() => {
  return materialFilter(materials.value, materialSearchFilter.value)
})

function selectMaterial(material: Material) {
  selectedMaterial.value = material
}

function clearSelection() {
  selectedMaterial.value = null
}

function confirmSelection() {
  emit('materialSelected', selectedMaterial.value)
  clearSelection()
}
function cloneMaterial(item: Material) {
  return {
    materialCode: item.materialCode,
    materialName: item.materialName,
    amount: 0,
    unit: 3,
    mainStep: 1,
    parallelStep: 1,
  }
}
function materialFilter(rows: Material[], terms: string) {
  terms = terms.toLowerCase()
  return rows.filter((row) => {
    const materialCodeMatches = row.materialCode.toLowerCase().includes(terms)
    const materialNameMatches = row.materialName.toLowerCase().includes(terms)
    const materialGroupMatches = type.value === 4 ? true : type.value === row.materialGroupNo
    return (materialCodeMatches || materialNameMatches) && materialGroupMatches
  })
}

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

const icons = [
  '',
  'science',
  'palette',
  'grain',
]
</script>

<template>
  <QTable
    :columns
    :rows="filteredMaterials"
    :filter="materialSearchFilter"
    :filter-method="materialFilter"
    row-key="materialCode"
    h-95
    mb-2
  >
    <template #header>
      <div class="mx-5 mb-5 flex-center">
        <QIcon
          :name="icons[type]"
          size="20px"
          mt-1
          mr-2
        />
        <QInput
          v-model="materialSearchFilter"
          :label="t('Search')"
        >
          <template #prepend>
            <QIcon name="search" />
          </template>
        </QInput>
        <QBtn
          icon="close"
          size="10px"
          flat
          round
          mt-1
          mr-2
          @click="$emit('close')"
        />
      </div>
    </template>
    <template #body="props">
      <draggable
        v-if="p.isDraggable"
        :list="[props.row]"
        :group="{ name: 'materials', pull: 'clone', put: false }"
        :clone="cloneMaterial"
        :sort="false"
        ghost-class="material-ghost"
      >
        <template #item="{ element }">
          <QTr>
            <QTd>
              <QIcon name="drag_handle" class="cursor-move" />
            </QTd>
            <QTd
              v-for="col in columns"
              :key="col.name"
              class="cursor-pointer"
              :style="col.name === 'materialCode' ? 'width: 100px;' : ''"
            >
              {{ element[col.name] }}
            </QTd>
          </QTr>
        </template>
      </draggable>
      <div v-else>
        <QTr
          :class="{ 'selected-row': selectedMaterial && selectedMaterial.materialCode === props.row.materialCode }"
          style="cursor: pointer;"
          @click="selectMaterial(props.row)"
        >
          <QTd>
            <QIcon name="adjust" cursor-pointer />
          </QTd>
          <QTd
            v-for="col in columns"
            :key="col.name"
            :style="col.name === 'materialCode' ? 'width: 100px;' : ''"
          >
            {{ props.row[col.name] }}
          </QTd>
        </QTr>
      </div>
    </template>
  </QTable>

  <div v-if="selectedMaterial" class="confirm-buttons-container">
    <QBtn
      :label="t('Confirm')"
      color="primary"
      @click="confirmSelection"
    />
    <QBtn
      :label="t('Cancel')"
      color="negative"
      @click="clearSelection"
    />
  </div>
</template>

<style scoped>
.material-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.selected-row {
  background-color: var(--q-primary);
}

.confirm-buttons-container {
  display: flex;
  justify-content: space-evenly;
  margin-top: 20px;
}
</style>
