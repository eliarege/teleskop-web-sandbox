<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { VNode } from 'vue'

const props = defineProps<{
  columns: Array<Column>
  rows: Array<any>
}>()

interface Column {
  name: string
  label: string
  style?: any
  format?: (value: any, row?: any) => string
  render?: (cell: Cell) => VNode
}

function mergeCellBelow(cellA: Cell, cellB: Cell) {
  return false
}
function mergeCellRight(cellA: Cell, cellB: Cell) {
  return false
}

interface Cell<T = any> {
  value: T
  col: Column
  row: any
  colIndex: number
  rowIndex: number
  _visited: boolean
  _group: number
  _below: Cell | null
  _right: Cell | null
  _rect: Rect | null
}
interface MergedCell extends Cell {
  _rect: Rect
}

interface Rect {
  colspan: number
  rowspan: number
}

interface Group {
  index: number
  cells: Cell[]
}

function RenderCell({ cell }: { cell: Cell }): VNode | string {
  if (cell.col.render) {
    return cell.col.render(cell)
  } else if (cell.col.format) {
    return cell.col.format(cell.value, cell.row)
  } else {
    return cell.value
  }
}

function renderCells(table: Record<string, any>[]): MergedCell[][] {
  const cells = [] as Cell[][]
  const mergedCells = [] as MergedCell[][]

  const rowSize = table.length
  const colSize = props.columns.length

  const checkAdjacents = (rowIndex: number, colIndex: number, group: Group) => {
    const cell = cells[rowIndex][colIndex]
    // Check below
    if (rowIndex + 1 < rowSize) {
      const cellBelow = cells[rowIndex + 1][colIndex]
      if (cellBelow._group < 0) {
        const merge = mergeCellBelow(cell, cellBelow)
        if (merge) {
          cellBelow._group = group.index
          cell._below = cellBelow
          group.cells.push(cellBelow)
          checkAdjacents(rowIndex + 1, colIndex, group)
        }
      } else if (cellBelow._group === group.index) {
        cell._below = cellBelow
      }
    }
    // Check right
    if (colIndex + 1 < colSize) {
      const cellRight = cells[rowIndex][colIndex + 1]
      if (cellRight._group < 0) {
        const merge = mergeCellRight(cell, cellRight)
        if (merge) {
          cellRight._group = group.index
          cell._right = cellRight
          group.cells.push(cellRight)
          checkAdjacents(rowIndex, colIndex + 1, group)
        }
      } else if (cellRight._group === group.index) {
        cell._right = cellRight
      }
    }
  }

  // First Loop: Prepare cells
  for (let rowIndex = 0; rowIndex < table.length; rowIndex++) {
    const row = table[rowIndex]
    cells[rowIndex] = []
    mergedCells[rowIndex] = []
    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const col = props.columns[colIndex]
      const value = row[col.name]
      cells[rowIndex][colIndex] = {
        value,
        col,
        row,
        colIndex,
        rowIndex,
        _visited: false,
        _group: -1,
        _below: null,
        _right: null,
        _rect: null,
      }
    }
  }

  // Merge-able cells are grouped
  const groups = [] as Group[]

  // Second Loop: Assign Groups
  for (let rowIndex = 0; rowIndex < table.length; rowIndex++) {
    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const cell = cells[rowIndex][colIndex]
      if (cell._group < 0) {
        const group: Group = {
          index: groups.length,
          cells: [cell],
        }
        groups.push(group)
        cell._group = group.index
        checkAdjacents(rowIndex, colIndex, group)
      }
    }
  }

  const inferRect = (cell: Cell) => {
    const rect: Rect = { colspan: 1, rowspan: 1 }
    let below = cell._below
    // Get height (rowspan)
    while (below) {
      rect.rowspan++
      below = below._below
    }
    let right = cell._right
    // Get height of adjacent columns
    while (right) {
      let size = 1
      let below = cell._below

      while (below) {
        size++
        below = below._below
      }
      // Reduce height of rect if adjacent columns are shorter
      if (size < rect.rowspan) {
        rect.rowspan = size
      }

      rect.colspan++
      right = right._right
    }

    // Mark all cells in rect as visited
    for (let i = cell.rowIndex; i < cell.rowIndex + rect.rowspan; i++) {
      for (let j = cell.colIndex; j < cell.colIndex + rect.colspan; j++) {
        cells[i][j]._visited = true
      }
    }
    return rect
  }

  // Third Loop: Infer rects
  for (let rowIndex = 0; rowIndex < table.length; rowIndex++) {
    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const cell = cells[rowIndex][colIndex]
      if (!cell._visited) {
        const shape = inferRect(cell)
        cell._rect = shape
        mergedCells[cell.rowIndex].push(cell as MergedCell)
      }
    }
  }

  return mergedCells
}

const cells = renderCells(props.rows)
</script>

<template>
  <table class="q-table--dense no-hover">
    <thead>
      <tr>
        <td v-for="col in columns" :key="col.name">
          {{ col.label }}
        </td>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(cx, i) in cells" :key="`x-${i}`">
        <td
          v-for="(c, j) in cx"
          :key="`y-${j}`"
          :style="c.col.style"
          :rowspan="c._rect.rowspan"
          :colspan="c._rect.colspan"
        >
          <RenderCell :cell="c" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
