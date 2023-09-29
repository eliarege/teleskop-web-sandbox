<script setup lang="ts">
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import RecipeTable from 'ui/components/RecipeTable.vue'
import type { Recipe } from '~/shared/types'

defineProps({
  data: {
    type: Array as PropType<Recipe[]>,
    required: true,
  },
})
const { t, locale } = useI18n()
const groupables = [
  { key: 'recIndex', index: 0 },
  { key: 'program', index: 1 },
  { key: 'reqNumber', index: 2 },
  { key: 'mainStep', index: 3 },
] as { key: keyof Recipe; index: number }[]
const columns = controlledComputed(locale, () => [
  { label: t('details.index'), prop: 'recIndex', align: 'center', showOverflowTooltip: true },
  { label: t('details.program'), prop: 'program', align: 'center', showOverflowTooltip: true },
  { label: t('details.number'), prop: 'reqNumber', align: 'center', showOverflowTooltip: true },
  { label: t('details.main-step'), prop: 'mainStep', align: 'center', showOverflowTooltip: true },
  { label: t('details.chem-code'), prop: 'chemCode', align: 'center', showOverflowTooltip: true },
  { label: t('details.material-name'), prop: 'materialName', align: 'center', showOverflowTooltip: true },
  { label: t('details.amount'), prop: 'newAmount', align: 'center', showOverflowTooltip: true },
] as { label: string; prop: string; align: 'left' | 'right' | 'start' | 'end' | 'center'; showOverflowTooltip: boolean }[])
</script>

<template>
  <div class="w-full h-full">
    <RecipeTable
      show
      title="Hello"
      is-first
      has-object-span-method
      full-screen
      :full-screen-button-props="{
        buttonText: 'Full Screen',
        plain: true,
        color: '#0d94fc',
      }"
      :groupables="groupables"
      :rows="data"
      :columns="columns"
      :empty-text="t('details.empty-text')"
      chem-class="green-class"
      dyeing-class="normal-class"
    />
  </div>
</template>

<style lang="postcss">
.normal-class {
  background: scroll !important;
}

.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}

@media screen and (max-width: 735px) {
  .disable {
    display: none !important;
  }

  .custom-btn {
    @apply hidden;
  }
}

@media (min-width: 735px) and (max-width: 1350px) {
  .el-table--small .el-table__cell {
    padding: 0 !important;
  }

  .custom-btn {
    @apply hidden;
  }
}
</style>
