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
const size = window.innerWidth
const groupables = [
  { key: 'processOrder', index: 0 },
  { key: 'recipeType', index: 1 },
  { key: 'programNo', index: 2 },
  { key: 'processOrder', index: 3 },
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
function a({ row, columnIndex }: SpanMethodProps) {
  // HARDCODED! columnIndex 4 === chemCode --> veri değişirse değiştir!
  if ((columnIndex === 7 || columnIndex === 8) && row.recipeType === 1) {
    return 'green-class'
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
          label="processOrder"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="recipeType"
          label="recipeType"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="programNo"
          label="programNo"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="processOrder"
          label="processOrder"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="ISN"
          label="ISN"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="mainStep"
          label="mainStep"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="parallelStep"
          label="parallelStep"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="chemCode"
          label="chemCode"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="materialName"
          label="materialName"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          label="programProcessNo"
          prop="programProcessNo"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          label="amount"
          prop="amount"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="unit"
          label="unit"
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
