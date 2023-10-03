<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus'
import { ElButton, ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'

interface Recipe {
  planKey: number | null
  recIndex: number | null
  recNo: number | null
  name: string | null
  reqNumber: number | null
  mainStep: number | null
  parallelStep: number | null
  recType: number | null
  chemCode: string | null
  materialName: string | null
  amount: number | null
  reqBatchNo: number | null
  reqProgNo: number | null
  otherUnit: number | null
  phaseNo: number | null
  phaseIndex: number | null
  washingName: string | null
  unit: number
}
interface RecipeTableProps {
  show: boolean
  title: string
  emptyText: string
  isFirst: boolean
  hasObjectSpanMethod: boolean
  fullScreen: boolean
  chemClass?: string
  dyeingClass?: string
  fullScreenButtonProps: {
    plain: boolean
    color: string
    cssCls?: string
    buttonText: string
  }
  groupables: {
    key: keyof Recipe
    index: number
  }[]
  rows: Recipe[]
  columns: {
    label: string
    prop: string
    align: 'left' | 'right' | 'start' | 'end' | 'center'
    showOverflowTooltip: boolean
  }[]
}
const props = defineProps<RecipeTableProps>()
const emits = defineEmits(['fullScren'])
interface SpanMethodProps {
  row: Recipe
  column: TableColumnCtx<Recipe>
  rowIndex: number
  columnIndex: number
}
function objectSpanMethod({ row, rowIndex, columnIndex }: SpanMethodProps) {
  if (props.hasObjectSpanMethod) {
    const property = props.groupables.find(prop => prop.index === columnIndex)
    if (!property) {
      return { rowspan: 1, colspan: 1 }
    }
    const prevRow = props.rows[rowIndex - 1] || {}
    const prevGroupables = props.groupables.slice(0, columnIndex + 1)
    let rowspan = 1

    const isSameAsPrevRow = prevGroupables.every(
      groupable => prevRow[groupable.key] === row[groupable.key],
    )

    if (isSameAsPrevRow) {
      return { rowspan: 0, colspan: 0 }
    }
    for (let i = rowIndex + 1; i < props.rows.length; i++) {
      const nextRow = props.rows[i]
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
  } else return { rowspan: 1, colspan: 1 }
}
function cellClass({ row, columnIndex }: SpanMethodProps) {
  if ((columnIndex === 4 || columnIndex === 5) && row.recType === 1) {
    return props.chemClass
  }
  return props.dyeingClass
}
</script>

<template>
  <div class="w-full h-full">
    <ElTable
      :span-method="objectSpanMethod"
      :data="rows"
      :border="true"
      table-layout="fixed"
      header-cell-class-name="whitespace-nowrap"
      :cell-class-name="cellClass"
      :row-class-name="dyeingClass"
      size="small"
      :empty-text="emptyText"
      :show-overflow-tooltip="true"
    >
      <ElTableColumn :label="title" align="center">
        <ElTableColumn
          v-for="(item, idx) in columns.slice(0, -1)"
          :key="idx"
          :label="item.label"
          :prop="item.prop"
          :align="item.align"
          :show-overflow-tooltip="item.showOverflowTooltip"
        />
        <ElTableColumn
          v-if="fullScreen"
          align="center"
        >
          <template #header>
            <ElButton
              :plain="fullScreenButtonProps.plain"
              :color="fullScreenButtonProps.color"
              @click="$emit('fullScren')"
            >
              {{ props.fullScreenButtonProps.buttonText }}
            </ElButton>
          </template>
          <ElTableColumn
            :label="props.columns[props.columns.length - 1].label"
            :prop="props.columns[props.columns.length - 1].prop"
            :align="props.columns[props.columns.length - 1].align"
            :show-overflow-tooltip="props.columns[props.columns.length - 1].showOverflowTooltip"
          />
        </ElTableColumn>
        <ElTableColumn
          v-else
          :label="props.columns[props.columns.length - 1].label"
          :prop="props.columns[props.columns.length - 1].prop"
          :align="props.columns[props.columns.length - 1].align"
          :show-overflow-tooltip="props.columns[props.columns.length - 1].showOverflowTooltip"
        />
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style lang="postcss">
@media (min-width: 735px) and (max-width: 1350px) {
  .el-table--small .el-table__cell {
    padding: 0 !important;
  }
}
</style>
