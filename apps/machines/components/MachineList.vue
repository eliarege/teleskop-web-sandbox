<script setup lang="ts" generic="T extends object">
import type { Machine, MachineGroup, MachineTableColumn } from '~/types'

const props = defineProps<{
  formClass: string
  rows: Machine[]
  columns: MachineTableColumn[]
  machineGroups: MachineGroup[]
}>()
const selected = defineModel('selected', {
  type: Array as PropType<Array<Machine>>,
  default: () => [],
  required: true,
})

function isRowSelected(row: Machine) {
  return selected.value.includes(row)
}

function removeSelection(row: Machine) {
  selected.value = selected.value.filter(r => r.machineId !== row.machineId)
}
// const shift = useKeyModifier('Shift')
const ctrl = useKeyModifier('Control')
let cursor = -1
let lastDirection = 0
onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (selected.value.length === 0 || cursor === -1) {
    cursor = 0
    selected.value = [props.rows[0]]
    return
  }
  if (lastDirection !== -1) {
    cursor++
    cursor %= props.rows.length
  }
  const next = props.rows[cursor]
  if (!ctrl.value) {
    selected.value = [next]
  } else {
    if (selected.value.includes(next))
      selected.value = selected.value.filter(s => s.machineId !== next.machineId)
    else
      selected.value.push(next)
  }
  lastDirection = 1
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (selected.value.length === 0 || cursor === -1) {
    cursor = 0
    selected.value = [props.rows[0]]
    return
  }
  if (lastDirection !== 1) {
    cursor--
    if (cursor < 0)
      cursor += props.rows.length
  }

  const next = props.rows[cursor]
  if (!ctrl.value) {
    selected.value = [next]
  } else {
    if (selected.value.includes(next))
      selected.value = selected.value.filter(s => s.machineId !== next.machineId)
    else
      selected.value.push(next)
  }
  lastDirection = -1
})

function onRowClick(row: Machine) {
  lastDirection = 0
  cursor = props.rows.findIndex(r => r.machineId === row.machineId)
  if (isRowSelected(row)) {
    removeSelection(row)
  } else {
    if (ctrl.value) {
      if (selected.value.includes(row)) {
        removeSelection(row)
      } else {
        selected.value = [...selected.value, row]
      }
      return
    }
    // if (shift.value && selected.value.length > 0) {
    //   const lastSelected = selected.value[selected.value.length - 1]
    //   const startIndex = props.rows.indexOf(lastSelected)
    //   const endIndex = props.rows.indexOf(row)

    //   if (startIndex !== -1 && endIndex !== -1) {
    //     const range = props.rows.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
    //     selected.value = [...new Set([...selected.value, ...range])]
    //   }
    // } else {
    selected.value = [row]
    // }
  }
}
function selectAll() {
  if (selected.value.length === props.rows.length) {
    selected.value = []
  } else {
    const missingRows = props.rows.filter(row => !selected.value.includes(row))
    selected.value = [...selected.value, ...missingRows]
  }
}
</script>

<template>
  <div>
    <q-table
      :rows="rows"
      :columns
      :hide-bottom="true"
      row-key="machineId"
      binary-state-sort
      class="overflow-y-auto select-none"
      :rows-per-page-options="[0]"
      table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
      table-header-class="bg-gray-1 dark:bg-dark-4"
    >
      <template #header="topProps">
        <q-tr :props="topProps">
          <q-th
            class="text-center"
            style="width: 50px;"
          >
            <q-checkbox
              :model-value="selected.length === rows.length"
              :val="rows"
              @click.stop="selectAll"
            />
          </q-th>
          <q-th
            v-for="col in topProps.cols"
            :key="col.name"
            :props="topProps"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template #body="bodyProps">
        <q-tr :props="bodyProps">
          <q-td>
            <q-checkbox
              v-model="selected"
              :val="bodyProps.row"
              @click="onRowClick(bodyProps.row)"
            />
          </q-td>
          <q-td
            v-for="col in bodyProps.cols"
            :key="col.name"
            :props="bodyProps"
            @click="onRowClick(bodyProps.row)"
          >
            <div v-if="col.value === true">
              <TwIcon
                name="i-mdi-check"
                size="20px"
                color="green"
              />
            </div>
            <div v-else-if="col.value === false">
              <TwIcon
                name="i-mdi-close"
                size="20px"
                color="red"
              />
            </div>
            <div v-else>
              {{ col.value }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
