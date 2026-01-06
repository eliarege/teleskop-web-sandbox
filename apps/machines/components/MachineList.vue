<script setup lang="ts" generic="T extends object">
import type { IContextMenuOption } from './ContextMenu.vue'
import type { Machine, MachineGroup, MachineTableColumn } from '~/types'

const props = defineProps<{
  formClass: string
  rows: Machine[]
  columns: MachineTableColumn[]
  machineGroups: MachineGroup[]
}>()
const emit = defineEmits(['machineDblclick'])
const selected = defineModel('selected', {
  type: Array as PropType<Array<Machine>>,
  default: () => [],
  required: true,
})
const { t } = useI18n()
const kc = useKeycloak()
const copy = ref<number | null>(null)
const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

const isTonello = (machine: Machine) => machine.tbbModel === 'Tonello'

const visibleColumns = computed(() => {
  return props.columns.filter(col => col.visible !== false).map(col => col.name)
})

const contextMenuOptions = computed<IContextMenuOption[]>(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selected.value.length !== 1 || isTonello(selected.value[0]),
    onClick: () => {
      copy.value = selected.value[0].machineId
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selected.value.length !== 1 || !copy.value || isTonello(selected.value[0]),
    onClick: async () => {
      await kc.fetch('/api/io/copy', {
        method: 'POST',
        body: {
          sourceMachineId: copy.value,
          targetMachineId: selected.value[0].machineId,
        },
      })
    },
  },
  {
    label: 'Mimic',
    category: 'edit',
    disabled: selected.value.length !== 1 || isTonello(selected.value[0]),
    onClick: () => showMimic.value = true,
  },
  {
    label: t('machineConstants'),
    category: 'edit',
    disabled: selected.value.length !== 1,
    onClick: () => showMachineParameters.value = true,
  },
  {
    label: t('formulas'),
    category: 'edit',
    disabled: selected.value.length !== 1 || isTonello(selected.value[0]),
    onClick: async () => {
      await navigateTo({
        path: `/formulas/${selected.value[0].machineId}`,
      })
    },
  },
  {
    label: t('setDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.length === 0 || isTonello(selected.value[0]),
    onClick: () => showSetDyeHouseDefinitions.value = true,
  },
  {
    label: t('getDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.length === 0 || isTonello(selected.value[0]),
    onClick: () => showGetDyeHouseDefinitions.value = true,
  },
])

function isRowSelected(row: Machine) {
  return selected.value.some(s => s.machineId === row.machineId)
}

function removeSelection(row: Machine) {
  selected.value = selected.value.filter(r => r.machineId !== row.machineId)
}
const ctrl = useKeyModifier('Control')
const focusedIndex = ref(-1)

let cursor = -1
let lastDirection = 0

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  event.preventDefault()
  // Select first row if nothing is selected
  if (selected.value.length === 0 || cursor === -1) {
    cursor = 0
    selected.value = [props.rows[0]]
    focusedIndex.value = 0
    return
  }
  // Edge-case: if item at the end is not selected, we need to select it
  if (cursor === props.rows.length - 1) {
    if (!isRowSelected(props.rows[cursor])) {
      selected.value.push(props.rows[cursor])
      focusedIndex.value = cursor
    } else {
      return
    }
  } else {
    if (!ctrl.value || (ctrl.value && lastDirection !== -1)) {
      cursor++
    }
    let next = props.rows[cursor]
    if (!ctrl.value) {
      selected.value = [next]
      focusedIndex.value = cursor
    } else {
      if (isRowSelected(next)) {
        if (selected.value.length > 1) {
          selected.value = selected.value.filter(s => s.machineId !== next.machineId)
          focusedIndex.value = cursor + 1
        } else if (cursor < props.rows.length - 1) {
          // Move to next item if it's the only one selected
          cursor++
          next = props.rows[cursor]
          if (isRowSelected(next)) {
            selected.value = selected.value.filter(s => s.machineId !== next.machineId)
          } else {
            selected.value.push(next)
          }
        }
      } else {
        selected.value.push(next)
        focusedIndex.value = cursor
      }
    }
  }
  scrollToRow(cursor)
  lastDirection = 1
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (selected.value.length === 0 || cursor === -1) {
    cursor = 0
    selected.value = [props.rows[0]]
    focusedIndex.value = 0
    return
  }
  // Edge-case: if item at the start is not selected, we need to select it
  if (cursor === 0) {
    if (!isRowSelected(props.rows[cursor])) {
      selected.value.push(props.rows[cursor])
      focusedIndex.value = cursor
    } else {
      return
    }
  } else {
    if (!ctrl.value || (ctrl.value && lastDirection !== 1)) {
      cursor--
    }

    let next = props.rows[cursor]
    if (!ctrl.value) {
      selected.value = [next]
      focusedIndex.value = cursor
    } else {
      if (isRowSelected(next)) {
        if (selected.value.length > 1) {
          selected.value = selected.value.filter(s => s.machineId !== next.machineId)
          focusedIndex.value = cursor - 1
        } else if (cursor > 0) {
          // Move to previous item if it's the only one selected
          cursor--
          next = props.rows[cursor]
          if (isRowSelected(next)) {
            selected.value = selected.value.filter(s => s.machineId !== next.machineId)
          } else {
            selected.value.push(next)
          }
        }
      } else {
        selected.value.push(next)
        focusedIndex.value = cursor
      }
    }
  }
  scrollToRow(cursor)
  lastDirection = -1
})

let lastScrollTime = 0

function scrollToRow(index: number) {
  const row = document.querySelectorAll('.machine-list tbody tr')[index] as HTMLElement | undefined
  if (row) {
    const currTime = Date.now()
    const scrollBehavior = currTime - lastScrollTime < 100 ? 'instant' : 'smooth'
    lastScrollTime = currTime
    row.scrollIntoView({ block: 'center', behavior: scrollBehavior })
  }
}

function chooseMachineRow(row: Machine) {
  lastDirection = 0
  cursor = props.rows.findIndex(r => r.machineId === row.machineId)
  if (!isRowSelected(row)) {
    if (ctrl.value) {
      if (selected.value.includes(row)) {
        removeSelection(row)
      } else {
        selected.value = [...selected.value, row]
        focusedIndex.value = cursor
      }
      return
    }
    selected.value = [row]
    focusedIndex.value = cursor
  }
}
function onRowDblClick(row: Machine) {
  emit('machineDblclick', row)
}
function selectAll() {
  if (selected.value.length === props.rows.length) {
    selected.value = []
  } else {
    selected.value = [...props.rows]
  }
}
</script>

<template>
  <div>
    <q-table
      :rows="rows"
      :columns
      dense
      :visible-columns="visibleColumns"
      row-key="machineId"
      binary-state-sort
      class="machine-list"
      :rows-per-page-options="[0]"
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
        <q-tr
          :props="bodyProps"
          class="machine-row"
          :class="[
            isRowSelected(bodyProps.row)
              ? focusedIndex === bodyProps.rowIndex
                ? '!bg-blue-200 dark:!bg-dark-2'
                : '!bg-blue-100 dark:!bg-dark-3'
              : '',
          ]"
          @click="chooseMachineRow(bodyProps.row)"
          @contextmenu.prevent="chooseMachineRow(bodyProps.row)"
        >
          <q-td>
            <q-checkbox
              v-model="selected"
              :val="bodyProps.row"
            />
          </q-td>
          <q-td
            v-for="col in bodyProps.cols"
            :key="col.name"
            :props="bodyProps"
            @dblclick="onRowDblClick(bodyProps.row)"
          >
            <div v-if="typeof col.value === 'boolean'">
              <TwIcon
                :name="col.value ? 'i-mdi-check' : 'i-mdi-close'"
                size="20px"
                :color="col.value ? 'green' : 'red'"
              />
            </div>
            <div v-else>
              {{ col.value }}
            </div>
          </q-td>
          <ContextMenu
            :options="contextMenuOptions"
            @click="(option) => option.onClick(selected)"
          />
        </q-tr>
      </template>
    </q-table>
    <GetDyeHouseDefinitionsDialog
      v-if="showGetDyeHouseDefinitions && selected[0]"
      :show="showGetDyeHouseDefinitions"
      :selected="selected[0]!"
      @close="showGetDyeHouseDefinitions = false"
    />
    <SetDyeHouseDefinitionsDialog
      v-if="showSetDyeHouseDefinitions && selected[0]"
      :show="showSetDyeHouseDefinitions"
      :selected="selected[0]!"
      @close="showSetDyeHouseDefinitions = false"
    />
    <MachineParametersDialog
      v-if="showMachineParameters"
      :show="showMachineParameters"
      :selected="selected[0]"
      @close="showMachineParameters = false"
    />
    <MimicDialog
      v-if="showMimic"
      :show="showMimic"
      :selected="selected[0]"
      @close="showMimic = false"
    />
  </div>
</template>

<style lang="postcss">
.machine-list {
  height: calc(100vh - 110px);
  overflow-y: auto;
  user-select: none;

  .q-table {
    padding-bottom: 10vh;
  }

  tbody tr:last-child > td {
    border-bottom-width: 1px !important;
  }

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    @apply bg-white dark:bg-dark-4;
  }
  thead tr th {
    position: sticky;
    z-index: 1;
  }
  thead tr:first-child th {
    top: 0;
  }
}
</style>
