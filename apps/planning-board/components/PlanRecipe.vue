<script setup lang="ts">
import { LoadingSpinner } from 'ui'
import type { TableColumnCtx } from 'element-plus'
import type { RecipeRaw } from '~/shared/types'

const props = defineProps<{ machineId: number, jobOrder: string }>()

const { t } = useI18n()

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
] as { key: keyof RecipeRaw, index: number }[]
const columns = computed(() => [
  { label: t('index'), prop: 'recIndex', align: 'center', showOverflowTooltip: true },
  { label: t('program'), prop: 'program', align: 'center', showOverflowTooltip: true },
  { label: t('number'), prop: 'reqNumber', align: 'center', showOverflowTooltip: true },
  { label: t('main-step'), prop: 'mainStep', align: 'center', showOverflowTooltip: true },
  { label: t('chem-code'), prop: 'chemCode', align: 'center', showOverflowTooltip: true },
  { label: t('material-name'), prop: 'materialName', align: 'center', showOverflowTooltip: true },
  { label: t('amount'), prop: 'newAmount', align: 'center', showOverflowTooltip: true },
] as { label: string, prop: string, align: 'left' | 'right' | 'start' | 'end' | 'center', showOverflowTooltip: boolean }[])
</script>

<template>
  <div v-show="pending">
    <LoadingSpinner has-background />
  </div>
  <div>
    <div class="w-full h-full">
      <RecipeTable
        show
        :title="t('title')"
        is-first
        has-object-span-method
        :full-screen="false"
        :groupables="groupables"
        :rows="recipeData?.autoRecipe || []"
        :columns="columns"
        :cell-class="cellClass"
        :empty-text="t('empty-text')"
        chem-class="green-class"
        dyeing-class="normal-class"
      />
      <div v-if="recipeData?.manualRecipe?.length">
        <RecipeTable
          show
          :title="t('manuel.title')"
          :is-first="false"
          has-object-span-method
          :full-screen="false"
          :groupables="groupables"
          :rows="recipeData?.manualRecipe || []"
          :columns="columns"
          :empty-text="t('manuel.empty-text')"
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

<i18n>
  {
  "en": {
    "title": "Automatic Recipe",
    "manuel": {
      "title": "Manual Recipe",
      "empty-text": "No Recipe to show"
    },
    "index": "Index",
    "program": "Program",
    "number": "Number",
    "main-step": "Main Step",
    "chem-code": "Chemical Code",
    "material-name": "Material Name",
    "amount": "Amount",
    "empty-text": "No Recipe to show"
  },
  "tr": {
    "title": "Otomatik Reçete",
    "manuel": {
      "title": "Manuel Reçete",
      "empty-text": "Gösterilecek Reçete yok"
    },
    "index": "İndeks",
    "program": "Program",
    "number": "Numara",
    "main-step": "Ana Adım",
    "chem-code": "Kimyasal Kodu",
    "material-name": "Materyal İsmi",
    "amount": "Adet",
    "empty-text": "Gösterilecek Reçete yok"
  }
}
</i18n>
