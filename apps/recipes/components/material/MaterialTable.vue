<script setup lang="ts">
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Material } from '~/shared/types'
import { RecipeIcons, RecipeType } from '~/shared/constants'
import { useStateStore } from '~/store/State'
import { getDefaultUnitType } from '~/utils/unitDefaults'

const p = defineProps({
  isDraggable: {
    type: Boolean,
    default: false,
  },
  showTypeFilter: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['materialSelected', 'close', 'toggleVisibility', 'materialAdded'])
const { t } = useI18n()
const stateStore = useStateStore()
const materials = ref<Material[]>([])
const selectedMaterial = ref<Material | null>(null)
const materialSearchFilter = ref('')
const type = ref<number>(RecipeType.MATERIALS)
const isCollapsed = ref(false)
const selectedStep = ref<{ step: any, type: number, stepIndex: number } | null>(null)
const showManualOnly = ref(false)

defineExpose({
  type,
  setSelectedStep,
  showManualOnly,
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
    type: item.materialGroupNo - 1,
    amount: 0,
    unit: getDefaultUnitType(stateStore, item.materialGroupNo - 1),
    orderNo: 1,
    mainStep: 1,
    parallelStep: 1,
    isManual: item.isManual,
  }
}
function materialFilter(rows: readonly Material[], terms: string): Material[] {
  terms = terms.toLowerCase()
  return rows.filter((row) => {
    const materialCodeMatches = row.materialCode.toLowerCase().includes(terms)
    const materialNameMatches = row.materialName.toLowerCase().includes(terms)
    const materialGroupMatches = type.value === RecipeType.MATERIALS ? true : type.value + 1 === row.materialGroupNo
    const manualMatches = showManualOnly.value ? row.isManual : true
    return (materialCodeMatches || materialNameMatches) && materialGroupMatches && manualMatches
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

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  emit('toggleVisibility', isCollapsed.value)
}

function setSelectedStep(stepInfo: any) {
  selectedStep.value = stepInfo
}

function addMaterialToStep(material: Material) {
  if (!selectedStep.value) {
    q.notify({
      message: t('NoStepSelected'),
      color: 'warning',
    })
    return
  }

  emit('materialAdded', material)
}
</script>

<template>
  <div class="material-table-wrapper">
    <!-- Header with selected step info -->
    <div class="material-table-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <QIcon
            :name="RecipeIcons[type]"
            size="20px"
            class="q-mr-sm"
          />
          <span class="text-subtitle1">{{ t('Materials') }}</span>
        </div>

        <QBtn
          :icon="isCollapsed ? 'visibility' : 'visibility_off'"
          :label="isCollapsed ? t('Show') : t('Hide')"
          size="sm"
          outline
          color="primary"
          @click="toggleCollapse"
        />
      </div>

      <!-- Selected Step Indicator -->
      <div v-if="selectedStep" class="selected-step-indicator">
        <QChip
          :color="selectedStep.type === RecipeType.CHEM ? 'green' : selectedStep.type === RecipeType.DYE ? 'orange' : 'blue'"
          text-color="white"
          size="sm"
        >
          {{ t(`recipeTypes.${selectedStep.type}`) }} - {{ t('StepNo') }} {{ selectedStep.step.orderNo }}
        </QChip>
      </div>
    </div>

    <div v-show="!isCollapsed" class="material-table-content">
      <QTable
        :columns
        :rows="filteredMaterials"
        :filter="materialSearchFilter"
        :filter-method="materialFilter"
        row-key="materialCode"
        :pagination="{ rowsPerPage: 10 }"
        h-160
        mb-2
      >
        <template #header>
          <div class="mx-5 mb-5 flex-center">
            <QSelect
              v-show="p.showTypeFilter"
              v-model="type"
              :options="[
                { label: t(`recipeTypes.${RecipeType.CHEM}`), value: RecipeType.CHEM },
                { label: t(`recipeTypes.${RecipeType.DYE}`), value: RecipeType.DYE },
                { label: t(`recipeTypes.${RecipeType.SALT}`), value: RecipeType.SALT },
                { label: t(`recipeTypes.${RecipeType.MATERIALS}`), value: RecipeType.MATERIALS },
              ]"
              borderless
              dense
              outlined
              map-options
              emit-value
              :label="t('SelectType')"
              class="material-type-select q-mr-md"
            />

            <QCheckbox
              v-model="showManualOnly"
              :label="t('ManualOnly')"
              class="q-mr-md"
              dense
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
              v-if="!isDraggable"
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
            item-key="materialCode"
            :list="[props.row]"
            :group="{ name: 'materials', pull: 'clone', put: false }"
            :clone="cloneMaterial"
            :sort="false"
            ghost-class="material-ghost"
          >
            <template #item="{ element }">
              <QTr @dblclick="addMaterialToStep(element)">
                <QTd>
                  <div class="flex items-center gap-2">
                    <QBtn
                      v-if="selectedStep"
                      icon="add"
                      size="sm"
                      color="primary"
                      flat
                      round
                      :title="t('AddToSelectedStep')"
                      @click="addMaterialToStep(element)"
                    />
                    <QIcon
                      v-else
                      name="drag_handle"
                      class="cursor-move"
                    />
                  </div>
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
    </div>
  </div>
</template>

<style scoped>
.material-table-wrapper {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.material-table-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
  border-radius: 4px 4px 0 0;
}

.material-table-content {
  padding: 8px;
}

.body--dark .material-table-wrapper {
  background: var(--q-dark);
}

.body--dark .material-table-header {
  background: var(--q-dark-page);
  border-bottom-color: #333;
}

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

.material-type-select {
  width: 150px;
}

.selected-step-indicator {
  margin-top: 8px;
}
</style>
