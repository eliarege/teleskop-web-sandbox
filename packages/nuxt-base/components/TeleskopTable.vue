<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { textTruncate } from '@teleskop/utils'

interface RecipeTableProps {
  data: any[]
  title: string
  columns: QTableColumn[]
  align: 'center' | 'left' | 'right'
  mergeCellsActive: boolean
}

const props = withDefaults(defineProps<RecipeTableProps>(), {
  align: 'center',
  mergeCellsActive: true,
})

function cellClass(row: any, columnIndex: number): string {
  if ((columnIndex === 4 || columnIndex === 5) && row.recType === 1) {
    return 'green-class'
  }
  return ''
}
const textAlign = computed(() => {
  if (props.align === 'center')
    return 'text-center'
  else if (props.align === 'left')
    return 'text-left'
  else
    return 'text-right'
})

function mergeCellBelow(cellA: Omit<Cell, '_skip'>, cellB: Omit<Cell, '_skip'>) {
  if (cellA.col.name !== cellB.col.name)
    return false

  if (cellA.value !== cellB.value)
    return false

  const colIndex = props.columns.findIndex(col => col.name === cellA.col.name)
  if (colIndex === -1)
    return false

  for (let i = 0; i < colIndex; i++) {
    const colName = props.columns[i].name
    if (cellA.row[colName] !== cellB.row[colName]) {
      return false
    }
  }

  return true
}

// function mergeCellRight(cellA: Omit<Cell, '_skip'>, cellB: Omit<Cell, '_skip'>) {
//   return cellA.value === cellB.value
// }

interface Cell {
  value: any
  col: any
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

function renderCells(table: Record<string, any>[]): MergedCell[][] {
  if (!props.mergeCellsActive) {
    return table.map(row =>
      props.columns.map((col, colIndex) => ({
        value: row[col.name],
        col,
        row,
        colIndex,
        rowIndex: table.indexOf(row),
        _visited: true,
        _group: -1,
        _below: null,
        _right: null,
        _rect: { rowspan: 1, colspan: 1 },
      })),
    )
  }
  const cells = [] as Cell[][]
  const mergedCells = [] as MergedCell[][]

  const rowSize = table.length
  // const colSize = props.columns.length

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
    // if (colIndex + 1 < colSize) {
    //   const cellRight = cells[rowIndex][colIndex + 1]
    //   if (cellRight._group < 0) {
    //     const merge = mergeCellRight(cell, cellRight)
    //     if (merge) {
    //       cellRight._group = group.index
    //       cell._right = cellRight
    //       group.cells.push(cellRight)
    //       checkAdjacents(rowIndex, colIndex + 1, group)
    //     }
    //   } else if (cellRight._group === group.index) {
    //     cell._right = cellRight
    //   }
    // }
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
    // Get height of adjacent props.columns
    while (right) {
      let size = 1
      let below = cell._below

      while (below) {
        size++
        below = below._below
      }
      // Reduce height of rect if adjacent props.columns are shorter
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

const cells = renderCells(props.data)
</script>

<template>
  <slot
    name="top"
    class="q-table__top"
    :title="title"
    :columns
  />
  <div class="q-table__container q-table--horizontal-separator q-table--dense q-table--no-wrap">
    <div class="q-table__middle scroll">
      <slot
        name="title"
        :title
      >
        <div class="w-full h-full flex-center font-bold">
          {{ title }}
        </div>
      </slot>
      <table
        class="q-table no-hover"
        :class="textAlign"
      >
        <thead>
          <slot name="columns" :columns>
            <tr class="q-tr">
              <th
                v-for="col in columns"
                :key="col.name"
                class="q-th overflow-hidden"
              >
                <span class="w-min">
                  {{ textTruncate(col.label, 15).content }}
                  <q-tooltip v-if="textTruncate(col.label, 15).tooltip" :delay="300">
                    {{ col.label }}
                  </q-tooltip>
                </span>
              </th>
            </tr>
          </slot>
        </thead>
        <tbody>
          <tr
            v-for="(cx, i) in cells"
            :key="`x-${i}`"
            class="q-tr"
          >
            <td
              v-for="(c, j) in cx"
              :key="`y-${j}`"
              :rowspan="c._rect.rowspan"
              :colspan="c._rect.colspan"
              :class="cellClass(c.row, c.colIndex)"
              class="q-td overflow-hidden"
            >
              <span class="w-min">
                {{ textTruncate(c.value, 15).content }}
                <q-tooltip v-if="textTruncate(c.value, 15).tooltip" :delay="300">
                  {{ c.value }}
                </q-tooltip>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.normal-class {
  background: none;
}

.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}
.q-table--dense .q-table th:first-child,
.q-table--dense .q-table td:first-child {
  padding-left: 8px;
}
.q-table--dense .q-table th:last-child,
.q-table--dense .q-table td:last-child {
  padding-right: 8px;
}
.q-table.no-hover tbody tr:hover td::before {
  content: unset !important;
}
.q-table {
  table-layout: fixed;
  width: 100%;
  border-width: 1px 1px 1px 1px;
  border-style: solid;
  border-color: #88888857;
}
.q-table th {
  border-width: 1px 1px 1px 1px;
  border-style: solid;
  border-color: #88888857;
}
.q-table td {
  border-width: 0 1px 0 1px;
  border-style: solid;
  border-color: #88888857;
}
</style>
