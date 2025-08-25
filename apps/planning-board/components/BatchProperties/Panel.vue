<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { PlanParameterProps } from '~/shared/types'
import { getRecipeUnitById } from '~/shared/enums'

const props = defineProps<{ planParameters: PlanParameterProps, jobOrder: string, machineId: number }>()
const { data: recipeData } = await useAuthFetch('/api/recipe', {
  query: { machineId: props.machineId, jobOrder: props.jobOrder },
})
const { t } = useI18n()
function formatWeighedAmount(value: number | null, unit: number) {
  if (value) {
    const grams = Math.floor(value / 1000)
    const milligrams = value % 1000
    return `${grams},${milligrams.toString().padStart(3, '0')} ${getRecipeUnitById(unit)}`
  } else return 0
}
const autoRecipe = computed(() => {
  if (recipeData.value) {
    return recipeData.value.autoRecipe.map(r => ({
      ...r,
      newAmount: `${r.amount} ${getRecipeUnitById(r.unit)}`,
      weighedAmount: formatWeighedAmount(r.weighedAmount, r.unit),
    }))
  } else return []
})
const manualRecipe = computed(() => {
  if (recipeData.value) {
    return recipeData.value.manualRecipe.map(r => ({
      ...r,
      newAmount: `${r.amount} ${getRecipeUnitById(r.unit)}`,
      weighedAmount: formatWeighedAmount(r.weighedAmount, r.unit),
    }))
  } else return []
})
const columns = computed(() => [
  { label: t('plan-recipe.index'), field: 'recIndex', name: 'recIndex', align: 'center' },
  { label: t('plan-recipe.program'), field: 'program', name: 'program', align: 'center' },
  { label: t('plan-recipe.number'), field: 'reqNumber', name: 'reqNumber', align: 'center' },
  { label: t('plan-recipe.main-step'), field: 'mainStep', name: 'mainStep', align: 'center' },
  { label: t('plan-recipe.chem-code'), field: 'chemCode', name: 'chemCode', align: 'center' },
  { label: t('plan-recipe.material-name'), field: 'materialName', name: 'materialName', align: 'center' },
  { label: t('plan-recipe.amount'), field: 'newAmount', name: 'newAmount', align: 'center' },
  { label: t('plan-recipe.recipe-amount'), field: 'weighedAmount', name: 'weighedAmount', align: 'center' },
] as QTableColumn[])
const tab = ref('planParameter')
</script>

<template>
  <div class="w-full h-full">
    <q-tabs
      v-model="tab"
      ripple="false"
    >
      <q-tab name="planParameter" label="Plan Parametreleri" />
      <q-tab name="recipe" label="Reçete" />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="tab"
      animated
    >
      <q-tab-panel name="planParameter">
        <PlanParameters v-bind="planParameters" />
      </q-tab-panel>
      <q-tab-panel name="recipe">
        <div class="w-full h-min px-3 overflow-auto">
          <TeleskopTable
            :columns
            :data="autoRecipe"
            merge-cells-active
            :title="t('plan-recipe.title')"
            align="center"
          />
          <TeleskopTable
            v-if="manualRecipe.length"
            :columns
            :data="manualRecipe"
            merge-cells-active
            :title="t('plan-recipe.manuel.title')"
            align="center"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
