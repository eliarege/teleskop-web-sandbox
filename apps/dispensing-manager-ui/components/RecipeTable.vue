<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RecipeLatest } from '~/shared/types'

const props = defineProps({
  data: {
    type: Array as PropType<RecipeLatest[]>,
    required: true,
  },
  show: Boolean,
  title: {
    type: String,
    required: true,
  },
  isFirst: {
    type: Boolean,
    required: true,
  },
  settings: Number,
})

const { t } = useI18n()
interface SpanMethodProps {
  row: RecipeLatest
  column: TableColumnCtx<RecipeLatest>
  rowIndex: number
  columnIndex: number
}
const groupables = [
  { key: 'processOrder', index: 0 },
  { key: 'recipeType', index: 1 },
  { key: 'programNo', index: 2 },
  { key: 'programName', index: 3 },
  { key: 'ISN', index: 4 },
  { key: 'mainStep', index: 5 },
  { key: 'parallelStep', index: 6 },
] as { key: keyof RecipeLatest; index: number }[]
function objectSpanMethod({ row, rowIndex, columnIndex }: SpanMethodProps) {
  const property = groupables.find(prop => prop.index === columnIndex)
  if (!property) {
    return { rowspan: 1, colspan: 1 }
  }
  const prevRow = props.data[rowIndex - 1] || {}
  const prevGroupables = groupables.slice(0, columnIndex + 1)
  let rowspan = 1

  const isSameAsPrevRow = prevGroupables.every(
    groupable => prevRow[groupable.key] === row[groupable.key],
  )

  if (isSameAsPrevRow) {
    return { rowspan: 0, colspan: 0 }
  }
  for (let i = rowIndex + 1; i < props.data.length; i++) {
    const nextRow = props.data[i]
    const isEqual = prevGroupables.every(
      groupable => nextRow[groupable.key] === row[groupable.key],
    )
    if (isEqual) {
      rowspan++
    } else {
      break
    }
  }
  return { rowspan, colspan: 1 }
}
const rgbClasses = ['violet-class', 'blue-class', 'green-class', 'red-class', 'aqua-class', 'orange-class']
function a({ row, columnIndex }: SpanMethodProps) {
  // HARDCODED! columnIndex 4 === chemCode --> veri değişirse değiştir!
  if ((columnIndex === 7 || columnIndex === 8) && row.recipeType === 1 && row.processOrder) {
    const color = rgbClasses[row.processOrder % rgbClasses.length]
    return color
  }
  return 'normal-class'
}
</script>

<template>
  <div class="w-full h-full">
    <ElTable
      :span-method="objectSpanMethod"
      :data="props.data"
      :border="true"
      :stripe="true"
      table-layout="fixed"
      header-cell-class-name="whitespace-nowrap"
      :cell-class-name="a"
      row-class-name="normal-class"
      size="small"
      empty-text="There is no Recipe to show."
      :show-overflow-tooltip="true"
    >
      <ElTableColumn :label="title" align="center">
        <ElTableColumn
          prop="processOrder"
          :label="t('recipe.processOrder')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="recipeType"
          :label="t('recipeType')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="programNo"
          :label="t('programNo')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="programName"
          :label="t('programName')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="ISN"
          :label="t('recipe.ISN')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="mainStep"
          :label="t('recipe.mainStep')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="parallelStep"
          :label="t('weighingInformation.parallelStep')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="chemCode"
          :label="t('materialCode')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="materialName"
          :label="t('materialName')"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('recipe.processNo')"
          prop="programProcessNo"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('recipe.amount')"
          prop="amount"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="unit"
          :label="t('recipe.metric')"
          align="center"
          show-overflow-tooltip
        />
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style lang="postcss">
.normal-class {
  background: scroll !important;
}
.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}
.orange-class {
  background: rgba(235, 155, 36, 0.6) !important;
}
.blue-class {
  background: rgba(40, 220, 220, 0.6) !important;
}
.red-class {
  background: rgba(250, 151, 175, 0.6) !important;
}
.aqua-class {
  background: rgba(144, 245, 245, 0.6) !important;
}
.violet-class {
  background: rgba(225, 145, 250, 0.6) !important;
}
@media screen and (max-width: 735px) {
  .disable {
    display: none !important;
  }
}
@media (min-width: 735px) and (max-width: 1350px) {
  .el-table--small .el-table__cell {
    padding: 0 !important;
  }
}
</style>
