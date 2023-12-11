<script setup lang="ts">
import { LoadingSpinner, RecipeTable } from 'ui'
import type { TableColumnCtx } from 'element-plus'
import type { RecipeRaw } from '~/shared/types'

const props = defineProps<{ machineId: number; jobOrder: string }>()
const { data: recipeData, pending } = await useFetch('/api/recipe', {
  query: { machineId: props.machineId, jobOrder: props.jobOrder },
})
export interface SpanMethodProps {
  row: RecipeRaw
  column: TableColumnCtx<RecipeRaw>
  rowIndex: number
  columnIndex: number
}
function cellClass({ row, columnIndex }: SpanMethodProps): string {
  // HARDCODED! columnIndex 4 === chemCode --> veri değişirse değiştir!
  if ((columnIndex === 4 || columnIndex === 5) && row.recType === 1) {
    return 'green-class'
  }
  return 'normal-class'
}
const groupables = [
  { key: 'recIndex', index: 0 },
  { key: 'program', index: 1 },
  { key: 'reqNumber', index: 2 },
  { key: 'mainStep', index: 3 },
] as { key: keyof RecipeRaw; index: number }[]
const columns = computed(() => [
  { label: 'index', prop: 'recIndex', align: 'center', showOverflowTooltip: true },
  { label: 'program', prop: 'program', align: 'center', showOverflowTooltip: true },
  { label: 'number', prop: 'reqNumber', align: 'center', showOverflowTooltip: true },
  { label: 'main-step', prop: 'mainStep', align: 'center', showOverflowTooltip: true },
  { label: 'chem-code', prop: 'chemCode', align: 'center', showOverflowTooltip: true },
  { label: 'material-name', prop: 'materialName', align: 'center', showOverflowTooltip: true },
  { label: 'amount', prop: 'newAmount', align: 'center', showOverflowTooltip: true },
] as { label: string; prop: string; align: 'left' | 'right' | 'start' | 'end' | 'center'; showOverflowTooltip: boolean }[])
</script>

<template>
  <div v-show="pending">
    <LoadingSpinner />
  </div>
  <div>
    <div class="w-full h-full">
      <RecipeTable
        show
        title="'recipe-t-auto'"
        is-first
        has-object-span-method
        :full-screen="false"
        :groupables="groupables"
        :rows="recipeData?.autoRecipe || []"
        :columns="columns"
        :cell-class="cellClass"
        empty-text="empty-text"
        chem-class="green-class"
        dyeing-class="normal-class"
      />
      <div v-if="recipeData?.manualRecipe?.length">
        <RecipeTable
          show
          title="recipe-t-manuel"
          :is-first="false"
          has-object-span-method
          :full-screen="false"
          :full-screen-button-props="{
            buttonText: 'btn-open',
            plain: true,
            color: '#0d94fc',
          }"
          :groupables="groupables"
          :rows="recipeData?.manualRecipe || []"
          :columns="columns"
          empty-text="empty-text"
          chem-class="green-class"
          dyeing-class="normal-class"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.normal-class {
  background: scroll !important;
}

.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}
</style>
