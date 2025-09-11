<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useSettingStore } from '~/store/settings'

const store = useSettingStore()
const { t } = useI18n()

const { data: recipe } = await useAuthFetch('/api/recipe', {
  query: { machineId: store.selectedEvent!.machineId, jobOrder: store.selectedEvent!.jobOrder },
})

const columns = computed(() => [
  { label: t('plan-recipe.index'), name: 'recIndex', field: 'recIndex', align: 'center' },
  { label: t('plan-recipe.program'), name: 'program', field: 'program', align: 'center' },
  { label: t('plan-recipe.number'), name: 'reqNumber', field: 'reqNumber', align: 'center' },
  { label: t('plan-recipe.main-step'), name: 'mainStep', field: 'mainStep', align: 'center' },
  { label: t('plan-recipe.chem-code'), name: 'chemCode', field: 'chemCode', align: 'center' },
  { label: t('plan-recipe.material-name'), name: 'materialName', field: 'materialName', align: 'center' },
  { label: t('plan-recipe.amount'), name: 'amount', field: 'amount', align: 'center' },
  { label: t('plan-recipe.recipe-amount'), field: 'weighedAmount', name: 'weighedAmount', align: 'center' },
] as QTableColumn[])

const autoRecipe = computed(() => recipe.value?.autoRecipe.map(a => ({
  ...a,
  program: `${a.recNo} | ${a.name}`,
  weighedAmount: formatWeighedAmount(a.weighedAmount, a.unit),
})) || [])
const manualRecipe = computed(() => recipe.value?.manualRecipe.map(m => ({
  ...m,
  program: `${m.recNo} | ${m.name}`,
  weighedAmount: formatWeighedAmount(m.weighedAmount, m.unit),
})) || [])
</script>

<template>
  <div class="min-w-250 w-full h-min p-3 bg-white overflow-auto">
    <TeleskopTable
      row-colors
      :columns
      :data="autoRecipe"
      :merge-cells-active="true"
      align="center"
      :title="t('plan-recipe.title')"
    />
    <div v-if="manualRecipe.length">
      <TeleskopTable
        row-colors
        :columns
        :data="manualRecipe"
        :merge-cells-active="true"
        align="center"
        :title="t('plan-recipe.manual.title')"
      />
    </div>
  </div>
</template>
