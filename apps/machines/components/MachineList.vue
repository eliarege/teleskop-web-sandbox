<script setup lang="ts" generic="T extends object">
import type { IContextMenuOption } from './ContextMenu.vue'
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

const { t } = useI18n()
const kc = useKeycloak()
const copy = ref<number | null>(null)
const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

const isTonello = (machine: Machine) => machine.tbbModel === 'Tonello'

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

function onRowClick(row: Machine, isContextMenu = false) {
  lastDirection = 0
  cursor = props.rows.findIndex(r => r.machineId === row.machineId)
  if (!isContextMenu && isRowSelected(row)) {
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
      dense
      :hide-bottom="true"
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
          :class="isRowSelected(bodyProps.row) ? '!bg-blue-100 dark:!bg-dark-3' : ''"
          @click="onRowClick(bodyProps.row, false)"
          @contextmenu.prevent="onRowClick(bodyProps.row, true)"
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
      :selected="selected[0] as Machine"
      @close="showGetDyeHouseDefinitions = false"
    />
    <SetDyeHouseDefinitionsDialog
      v-if="showSetDyeHouseDefinitions && selected[0]"
      :show="showSetDyeHouseDefinitions"
      :selected="selected[0] as Machine"
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
