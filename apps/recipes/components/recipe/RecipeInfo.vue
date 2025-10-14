<script setup lang="ts">
import type { BatchRecipeStep } from '~/shared/types'

const props = defineProps({
  batchNo: {
    type: String,
    required: true,
  },
  correctionNo: {
    type: String,
    required: true,
  },
  machineId: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()

const recipeData = ref<BatchRecipeStep[]>([])
const recipeDataTemp = ref()
const plankey = ref()
getRecipe()
async function getRecipe() {
  recipeDataTemp.value = await $fetch(`/api/recipes`, { query: { batchNo: props.batchNo, correctionNo: props.correctionNo } })
  if (!recipeDataTemp.value)
    recipeData.value = []
  else {
    recipeData.value = recipeDataTemp.value
    recipeData.value.forEach((row: any) => {
      row.unit = t(`units.${row.unit}`)
      row.recipeTypeText = t(`recipeTypes.${row.recipeType}`)
    })
    plankey.value = recipeData.value[0].planKey
  }
}
const columns = [
  { label: t('recipeFields.ProcessOrder'), prop: 'processOrder' },
  { label: t('recipeFields.RecipeType'), prop: 'recipeTypeText' },
  { label: t('ProgramNo'), prop: 'programNo' },
  { label: t('ProgramName'), prop: 'programName' },
  { label: t('recipeFields.ISN'), prop: 'ISN' },
  { label: t('recipeFields.MainStep'), prop: 'mainStep' },
  { label: t('recipeFields.ParallelStep'), prop: 'parallelStep' },
  { label: t('materialFields.Code'), prop: 'materialCode' },
  { label: t('materialFields.Name'), prop: 'materialName' },
  { label: t('recipeFields.ProcessNo'), prop: 'programProcessNo' },
  { label: t('Amount'), prop: 'amount' },
  { label: t('Unit'), prop: 'unit' },
]

const groupables = [
  { key: 'processOrder', index: 0 },
  { key: 'recipeType', index: 1 },
  { key: 'programNo', index: 2 },
  { key: 'programName', index: 3 },
  { key: 'ISN', index: 4 },
  { key: 'mainStep', index: 5 },
  { key: 'parallelStep', index: 6 },
]
</script>

<template>
  <div class="m-5">
    <RecipeTable
      show
      :title="t('recipeFields.Details', { batch: props.batchNo })"
      :is-first="false"
      has-object-span-method
      :groupables
      :rows="recipeData"
      chem-class="bg-green"
      dyeing-class="bg-scroll"
      :columns
      :empty-text="t('details.empty-text')"
    />
  </div>
</template>
