<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus'
import { ElButton, ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'

interface SpanMethodProps {
  row: any
  column: TableColumnCtx<any[]>
  rowIndex: number
  columnIndex: number
}
interface RecipeTableProps {
  show: boolean
  title: string
  emptyText: string
  isFirst: boolean
  hasObjectSpanMethod: boolean
  fullScreen?: boolean
  chemClass?: string
  dyeingClass?: string
  fullScreenButtonProps?: {
    plain: boolean
    color: string
    cssCls?: string
    buttonText: string
  }
  rows: any[]
  columns: {
    label: string
    prop: string
    align: 'left' | 'right' | 'start' | 'end' | 'center'
    showOverflowTooltip: boolean
  }[]
  groupables: {
    key: string
    index: number
  }[]
  cellClass?: string
}
const props = defineProps<RecipeTableProps>()
defineEmits(['fullscreen'])

function last<T>(array: T[]): T | undefined {
  return array[array.length - 1]
}

function objectSpanMethod({ row, rowIndex, columnIndex }: SpanMethodProps) {
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
}
</script>

<template>
  <div class="w-full h-full">
    <ElTable
      :data="rows"
      :border="true"
      table-layout="fixed"
      :span-method="objectSpanMethod"
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
            <div>
              <ElButton
                :plain="fullScreenButtonProps?.plain"
                :color="fullScreenButtonProps?.color"
                @click="$emit('fullscreen')"
              >
                {{ fullScreenButtonProps?.buttonText }}
              </ElButton>
            </div>
          </template>
          <ElTableColumn
            :label="last(props.columns)?.label"
            :prop="last(props.columns)?.prop"
            :align="last(props.columns)?.align"
            :show-overflow-tooltip="last(props.columns)?.showOverflowTooltip"
          />
        </ElTableColumn>
        <ElTableColumn
          v-else
          :label="last(props.columns)?.label"
          :prop="last(props.columns)?.prop"
          :align="last(props.columns)?.align"
          :show-overflow-tooltip="last(props.columns)?.showOverflowTooltip"
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
