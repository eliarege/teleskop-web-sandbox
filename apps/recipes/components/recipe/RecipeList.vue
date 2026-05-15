<script setup lang="ts">
import { withBase } from 'ufo'
import JobOrderBatchCreateDialog from '../job-order/JobOrderBatchCreateDialog.vue'
import RecipeContinueDialog from '../recipe/RecipeContinueDialog.vue'
import RecipeEditDialog from '../recipe/RecipeEditDialog.vue'
import RecipeVariantDialog from './RecipeVariantDialog.vue'
import RecipeVariantSelectionDialog from './RecipeVariantSelectionDialog.vue'
import type { Machine, RecipeProgramMaster, RecipeVariant } from '~/shared/types'
import { useStateStore } from '~/store/State'
import type { FilterableTableColumn } from '@teleskop/nuxt-base/types'
import type { QTableProps } from 'quasar'

const props = defineProps({
  isBatch: {
    type: Boolean,
    required: true,
  },
})

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const stateStore = useStateStore()

const selectedRecipe = ref<RecipeProgramMaster | null>(null)
const recipeVariants = ref<RecipeVariant[]>([])

const recipeFilters = ref([])
const variantFilters = ref([])

const recipes = ref<RecipeProgramMaster[]>()
const { data: machines } = await useFetch<Machine[]>('/api/machines', {
  default: () => [],
})

handleRecipeFilters(recipeFilters.value)

async function fetchRecipeVariants(recipeId: number, machineId: number) {
  try {
    recipeVariants.value = await $fetch<RecipeVariant[]>(`/api/recipes/variant/${recipeId}`, { query: { machineId } })
  } catch {
    notifyFail(t('Failed'))
  }
}
const recipeColumns: FilterableTableColumn[] = [
  {
    name: 'recipeId',
    label: t('recipeFields.ID'),
    field: 'recipeId',
    filterable: true,
    filterType: 'comparison',
    align: 'left',
  },
  {
    name: 'machineId',
    label: t('MachineName'),
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machineName',
    optionValue: 'machineId',
  },
  {
    name: 'recipeName',
    label: t('recipeFields.Name'),
    field: 'recipeName',
    filterable: true,
    filterType: 'includes',
    align: 'left',
  },
  {
    name: 'lastUpdate',
    label: t('recipeFields.LastUpdate'),
    field: 'lastUpdate',
    format: (val: string) => new Date(val).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    filterable: true,
    filterType: 'date',
    align: 'left',
  },
  {
    name: 'actions',
    label: t('Edit'),
    field: 'actions',
    align: 'right',
    filterable: false,
  },
]

const variantColumns: FilterableTableColumn[] = [
  {
    name: 'variantName',
    label: t('RecipeVariant'),
    field: 'variantName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'colorCode',
    label: t('jobOrderParams.ColorCode'),
    field: 'colorCode',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'colorName',
    label: t('jobOrderParams.ColorName'),
    field: 'colorName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]
async function handleRecipeFilters(updatedFilters: any) {
  recipeFilters.value = updatedFilters
  recipes.value =
    await $fetch<RecipeProgramMaster[]>(props.isBatch
      ? '/api/recipes/master/filtered'
      : '/api/recipes/master/continue/filtered', { method: 'POST', body: { filters: recipeFilters.value } })
}
async function handleVariantFilters(updatedFilters: any) {
  if (selectedRecipe.value) {
    variantFilters.value = updatedFilters
    recipeVariants.value = await $fetch<RecipeVariant[]>(`/api/recipes/variant/${selectedRecipe.value.recipeId}/filtered`, { method: 'POST', body: { filters: variantFilters.value } })
  }
}
function addNewRecipe() {
  const dialogComponent = props.isBatch ? RecipeEditDialog : RecipeContinueDialog
  q.dialog({
    component: dialogComponent,
    componentProps: {
      recipeId: findNextRecipeId(),
      machineId: stateStore.defaultMachine,
      recipeName: t('recipeFields.Placeholder'),
      isNew: true,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      handleRecipeFilters(recipeFilters.value)
    } else {
      notifyFail(t('Failed'))
    }
  })
}

function onRowClick(row: RecipeProgramMaster) {
  selectedRecipe.value = row
  fetchRecipeVariants(row.recipeId, row.machineId)
  variantFilters.value = []
}

function findNextRecipeId(): number {
  if (!recipes.value || recipes.value.length === 0) {
    return 1
  }
  const sorted = recipes.value.toSorted((a, b) => a.recipeId - b.recipeId)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].recipeId !== i + 1) {
      return i + 1
    }
  }
  return sorted.length + 1
}

function showRecipeEditDialog(row: RecipeProgramMaster) {
  const dialogComponent = props.isBatch ? RecipeEditDialog : RecipeContinueDialog
  q.dialog({
    component: dialogComponent,
    componentProps: {
      recipeId: row.recipeId,
      machineId: row.machineId,
      recipeName: row.recipeName,
      isNew: false,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      handleRecipeFilters(recipeFilters.value)
    } else {
      notifyFail(t('Failed'))
    }
  })
}

function onCreateJobOrder(recipeId: number, machineId?: number, variant?: RecipeVariant) {
  q.dialog({
    component: JobOrderBatchCreateDialog,
    componentProps: { recipeId, machineId, variant },
  }).onOk(async (payload: any) => {
    if (payload.print && payload.batchNo) {
      const jobOrderPrintPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
      await navigateTo({
        path: jobOrderPrintPath,
        query: { batchNo: String(payload.batchNo) },
      }, {
        open: {
          target: '_blank',
        },
      })
    }
    notifySuccess(t('Success'), { redirect: '/jobOrders' })
  })
}

function onCreateVariant(recipeMaster: RecipeProgramMaster) {
  q.dialog({
    component: RecipeVariantDialog,
    componentProps: { recipeMaster },
  }).onOk((payload) => {
    onCreateJobOrder(recipeMaster.recipeId, recipeMaster.machineId, payload)
  })
}

function onSelectVariant(recipeMaster: RecipeProgramMaster) {
  q.dialog({
    component: RecipeVariantSelectionDialog,
    componentProps: { recipeMaster },
  }).onOk((payload) => {
    onCreateJobOrder(recipeMaster.recipeId, recipeMaster.machineId, payload)
  })
}

const pagination = ref<QTableProps['pagination']>({ rowsPerPage: 0 })
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-center mt-4 mb-2">
      <QBtn
        :label="t('AddNewRecipe')"
        no-caps
        icon="note_add"
        color="primary"
        class="h-8"
        style="white-space: nowrap; text-overflow: ellipsis;"
        clickable
        @click="addNewRecipe"
      />
    </div>
    <div class="p-2 space-y-2">
      <FilterableTable
        flat
        bordered
        virtual-scroll
        :columns="recipeColumns"
        :rows="recipes"
        row-key="recipeId"
        class="!min-h-50vh !max-h-30vh"
        table-header-class="table-header"
        :pagination
        :rows-per-page-options="[0]"
        @update-filter-slots="handleRecipeFilters"
      >
        <template #custombody="props">
          <QTr
            :props="props"
            class="cursor-pointer"
            :class="{
              'bg-blue-100 text-blue-900': selectedRecipe?.recipeId === props.row.recipeId && selectedRecipe?.machineId === props.row.machineId && !$q.dark.isActive,
              'bg-blue-900 text-blue-100': selectedRecipe?.recipeId === props.row.recipeId && selectedRecipe?.machineId === props.row.machineId && $q.dark.isActive,
            }"
            @click="onRowClick(props.row)"
            @dblclick="showRecipeEditDialog(props.row)"
          >
            <QTd
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              <template v-if="col.name === 'actions'">
                <QBtn
                  icon="edit"
                  flat
                  dense
                  @click.stop="showRecipeEditDialog(props.row)"
                />
              </template>
              <template v-else-if="col.name === 'machineId'">
                {{ machines?.find(m => Number(m.machineId) === Number(col.value))?.machineName }}
              </template>
              <template v-else>
                {{ col.value }}
              </template>
              <QMenu
                touch-position
                context-menu
              >
                <QList>
                  <QItem
                    v-close-popup
                    clickable
                    @click="onCreateJobOrder(props.row.recipeId, props.row.machineId)"
                  >
                    <QItemSection>{{ t('NewBatchJobOrder') }}</QItemSection>
                  </QItem>
                  <QItem
                    v-close-popup
                    clickable
                    @click="onCreateVariant(props.row)"
                  >
                    <QItemSection>{{ t('CreateVariant') }}</QItemSection>
                  </QItem>
                  <QItem
                    v-close-popup
                    clickable
                    @click="onSelectVariant(props.row)"
                  >
                    <QItemSection>{{ t('SelectVariant') }}</QItemSection>
                  </QItem>
                </QList>
              </QMenu>
            </QTd>
          </QTr>
        </template>
      </FilterableTable>
      <FilterableTable
        v-if="selectedRecipe"
        flat
        bordered
        class="!min-h-35vh !max-h-35vh"
        :pagination="pagination"
        :columns="variantColumns"
        :rows="recipeVariants"
        row-key="variantName"
        table-header-class="table-header"
        @update-filter-slots="handleVariantFilters"
      >
        <template #custombody="props">
          <QTr
            :props="props"
            class="cursor-pointer"
            @click="onCreateJobOrder(selectedRecipe.recipeId, selectedRecipe.machineId, props.row)"
          >
            <QTd
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.value }}
            </QTd>
          </QTr>
        </template>
      </FilterableTable>
    </div>
  </div>
</template>
