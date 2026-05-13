<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useFuse } from '@vueuse/integrations/useFuse'
import type { QTableColumn } from 'quasar'
import { useQuasar } from 'quasar'
import { onKeyStroke } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { capitalize } from '~/shared/utils'
import type { ContextBarButtons, MachineInfo, PasteOptions, ProgramTableRow } from '~/shared/types'
import { ADDITIONAL_PROCESS_CODE_ILAVE, PROGRAM_STATUS_COLORS, ProgramStatus } from '~/shared/constants'
import { formatDuration, useErrorStore } from '~/composables/utils'
import { useContextBar } from '~/composables/useContextBar'
import { useEditorStore } from '~/composables/editor'
import { useMachineStatusStore } from '~/composables/machine'
import CMMachineListCopyAndSendDialog from '~/components/CMMachineListCopyAndSendDialog.vue'

definePageMeta({
  path: '/machine/:machine_id',
})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { notifyError } = useNotify()
const { $commandManager } = useNuxtApp()

const editor = useEditorStore()
const machine = useMachineStore()
const filter = useProgramFilterStore()
const machineStatusStore = useMachineStatusStore()

const tableRef = ref()
contextMenuStore.setCtx({ t, router })

const machineId = Number(route.params.machine_id)
const machineName = machine.currentMachine?.name || ''

const isDark = computed(() => $q.dark.isActive)

if (!machineId || !machine.hasMachine(machineId)) {
  if (machineId) {
    notifyError(t('machineNotFound', { machineId }))
  }

  const redirected = await machine.selectFirstUsableMachine()
  if (!redirected) {
    notifyError(t('noUsableMachineFound'))
  }
}

const sortedSelectedPrograms = computed(() =>
  editor.selectedPrograms.slice().sort((a, b) => a.programNo - b.programNo),
)

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('newProgram', { $q })
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (sortedSelectedPrograms.value.length === 1) {
    event.preventDefault()
    navigateTo(`/machine/${machineId}/program/${sortedSelectedPrograms.value[0].programNo}`)
  }
})

onKeyStroke('F5', async (event: KeyboardEvent) => {
  event.preventDefault()
  editor.isLoading = true
  await editor.refreshAllPrograms()
  editor.isLoading = false
})

onKeyStroke(['p', 'P'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('printProgram', { $q })
  }
})

onKeyStroke(['l', 'L'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('printProgramList', { $q })
  }
})

// onKeyStroke(['r', 'R'], async (event: KeyboardEvent) => {
//   if (event.ctrlKey && !isActiveElementEditable()) {
//     event.preventDefault()
//     await editor.loadMachine(machineId)
//   }
// })

onKeyStroke(['a', 'A'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    editor.selectedPrograms = editor.allPrograms
  }
})

onKeyStroke(['c', 'C'], (event: KeyboardEvent) => {
  if (event.ctrlKey && sortedSelectedPrograms.value.length && !isActiveElementEditable()) {
    event.preventDefault()
    contextMenuStore.copy(machineId, sortedSelectedPrograms.value)
  }
})

onKeyStroke(['v', 'V'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('pasteProgram', { $q }, machineId)
  }
})

onKeyStroke(['f', 'F'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    filter.showFilterPopup = true
  }
})

onKeyStroke(['Enter'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    if (sortedSelectedPrograms.value.length >= 1)
      navigateTo(`/machine/${machineId}/program/${sortedSelectedPrograms.value[0].programNo}`)
  }
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('deleteProgram', { $q }, sortedSelectedPrograms.value, machineId)
  }
})

onKeyStroke('Escape', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.selectedPrograms = []
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  if (isActiveElementEditable())
    return

  event.preventDefault()
  const currentIndex = editor.allPrograms.indexOf(sortedSelectedPrograms.value[0])

  if (currentIndex > 0) {
    const newSelection = editor.allPrograms[currentIndex - 1]
    editor.selectedPrograms = [newSelection]
  }
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  if (isActiveElementEditable())
    return

  event.preventDefault()
  const currentIndex = editor.allPrograms.indexOf(sortedSelectedPrograms.value[0])

  if (currentIndex < editor.allPrograms.length - 1) {
    const newSelection = editor.allPrograms[currentIndex + 1]
    editor.selectedPrograms = [newSelection]
  }
})

if (filter.existingFilter.clearOnChange)
  filter.clearFilter()

const isMoreThanOneRowSelected = computed(() => sortedSelectedPrograms.value.length > 1)
const hasOnlyOnController = computed(() => sortedSelectedPrograms.value.some(
  row => row.prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
))

const searchFilter = ref('')
const debouncedFilter = refDebounced(searchFilter, 250)

// Process type filtresini uygula
const processTypeFilteredPrograms = computed(() => {
  if (!filter.existingFilter.processType) {
    return editor.allPrograms
  }
  return editor.allPrograms.filter(p => p.typeId === filter.existingFilter.processType?.value)
})

const { results: filterResults } = useFuse(debouncedFilter, processTypeFilteredPrograms, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['programNo', 'name', 'type'],
  },
})
const filteredPrograms = computed<ProgramTableRow[]>(() => filterResults.value.map(res => res.item))

const buttons = computed<ContextBarButtons[]>(() => [
  {
    label: t('menu.newProgram'),
    originalLabel: t('menu.newProgram'),
    tooltip: t('menu.newProgram'),
    shortcut: 'F2',
    icon: 'add_circle_outline',
    onClick() {
      $commandManager.executeCommand('newProgram', { $q })
    },
  },
  {
    label: t('menu.editProgram'),
    originalLabel: t('menu.editProgram'),
    tooltip: t('menu.editProgram'),
    shortcut: 'F3',
    icon: 'edit',
    disable: isMoreThanOneRowSelected.value || !sortedSelectedPrograms.value.length,
    onClick() {
      navigateTo(`/machine/${machineId}/program/${sortedSelectedPrograms.value[0].programNo}`)
    },
  },
  {
    label: t('menu.deleteProgram'),
    originalLabel: t('menu.deleteProgram'),
    tooltip: t('menu.deleteProgram'),
    shortcut: 'Delete',
    icon: 'delete',
    disable: !sortedSelectedPrograms.value.length,
    onClick() {
      // TODO: Context cannot be provided by executor
      $commandManager.executeCommand(
        'deleteProgram',
        { $q },
        sortedSelectedPrograms.value,
        machineId,
      )
    },
  },
  {
    label: t('menu.copy'),
    originalLabel: t('menu.copy'),
    tooltip: t('menu.copy'),
    shortcut: 'Ctrl+C',
    icon: 'content_copy',
    disable: !sortedSelectedPrograms.value.length,
    onClick() {
      contextMenuStore.copy(machineId, sortedSelectedPrograms.value)
    },
  },
  {
    label: t('menu.paste'),
    originalLabel: t('menu.paste'),
    tooltip: t('menu.paste'),
    shortcut: 'Ctrl+V',
    disable: !contextMenuStore.isThereCopiedValue.value,
    icon: 'content_paste',
    onClick() {
      // TODO: Context cannot be provided by executor
      $commandManager.executeCommand('pasteProgram', { $q }, machineId)
    },
  },
  {
    label: t('menu.refresh'),
    originalLabel: t('menu.refresh'),
    tooltip: t('menu.refresh'),
    shortcut: 'F5',
    icon: 'refresh',
    onClick() {
      // TODO: Context cannot be provided by executor
      $commandManager.executeCommand('refresh', { $q }, machineId, machineName)
    },
  },
  {
    label: t('menu.checkErrors'),
    originalLabel: t('menu.checkErrors'),
    tooltip: t('menu.checkErrors'),
    disable: !sortedSelectedPrograms.value.length,
    icon: 'check_circle',
    onClick() {
      $commandManager.executeCommand('checkErrors', { $q }, machineId, sortedSelectedPrograms.value)
    },
  },
])
useContextBar(buttons)

function format(date: Date): string {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return capitalize(formatDistanceToNow(date, { addSuffix: true, locale: locale.value === 'tr' ? tr : enGB }))
}

function tooltip(value: Date): string {
  const date = new Date(value)
  return date.toLocaleString(locale.value)
}

interface ProgramTableColumn extends Omit<QTableColumn, 'label'> {
  name: string
  label: string
  field: keyof ProgramTableRow | ((row: ProgramTableRow) => any)
  sortable?: boolean
  hidden?: boolean
  align?: 'left' | 'right' | 'center'
  format?: (value: Date, row: ProgramTableRow) => string
  tooltip?: (value: Date, row: ProgramTableRow) => string
}

function getErrorCount(rowProgram: ProgramTableRow): number {
  const errorStore = useErrorStore()
  const error = errorStore.errors.find(e => e.machineId === machineId && e.programNo === rowProgram.programNo)

  if (!error)
    return 0

  return error.steps.reduce((total, step) => {
    return total + (step.commands?.length || 0)
  }, 0)
}

function getProcessTypeName(typeValue: number): string {
  return editor.allProcessTypes.find(pt => pt.value === typeValue)?.label || ''
}

const columns = computed<ProgramTableColumn[]>(() =>
  [
    {
      name: 'programNo',
      label: '#',
      field: 'programNo',
      sortable: true,
      align: 'left',
    },
    {
      name: 'name',
      label: t('program.name'),
      field: 'name',
      sortable: true,
      align: 'left',
    },
    {
      name: 'errorCount',
      label: t('program.errorCount'),
      field: (row: ProgramTableRow) => getErrorCount(row),
      align: 'center',
      sortable: false,
    },
    {
      name: 'duration',
      label: t('program.theoreticalDuration'),
      field: (row: ProgramTableRow) => formatDuration(row.duration),
      sortable: true,
      align: 'center',
    },
    {
      name: 'step_count',
      label: t('program.stepCount'),
      field: 'stepCount',
      sortable: true,
      align: 'center',
    },
    {
      name: 'type',
      label: t('program.type'),
      field: (row: ProgramTableRow) => getProcessTypeName(row.typeId),
      sortable: true,
      align: 'left',
    },
    {
      name: 'additionalType',
      label: t('program.additionalType'),
      field: (row: ProgramTableRow) => {
        if (row.typeId === ADDITIONAL_PROCESS_CODE_ILAVE && row.additionalTypeId) {
          return getProcessTypeName(row.additionalTypeId)
        }
        return ''
      },
      sortable: true,
      align: 'left',
      hidden: machine.isTonello,
    },
    {
      name: 'operator',
      label: t('program.opMud'),
      field: 'operator',
      sortable: true,
      align: 'center',
    },
    {
      name: 'totalChemReq',
      label: t('program.totalChemReq'),
      field: 'totalChemReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'totalDyeReq',
      label: t('program.totalDyeReq'),
      field: 'totalDyeReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'manChemReq',
      label: t('program.manChemReq'),
      field: 'manChemReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'autoChemReq',
      label: t('program.autoChemReq'),
      field: 'autoChemReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'autoDyeReq',
      label: t('program.autoDyeReq'),
      field: 'autoDyeReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'manDyeReq',
      label: t('program.manDyeReq'),
      field: 'manDyeReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'saltReq',
      label: t('program.saltReq'),
      field: 'saltReq',
      sortable: false,
      align: 'center',
    },
    {
      name: 'genericMat1Req',
      label: t('program.genericMat1Req'),
      field: 'genericMat1Req',
      sortable: false,
      align: 'center',
    },
    {
      name: 'genericMat2Req',
      label: t('program.genericMat2Req'),
      field: 'genericMat2Req',
      sortable: false,
      align: 'center',
    },
    {
      name: 'updated_at',
      label: t('program.updated'),
      field: 'updatedAt',
      sortable: true,
      align: 'right',
      format,
      tooltip,
    },
  ].filter(col => !col.hidden) as ProgramTableColumn[],
)

const contextMenuOptions = computed(() => [
  [
    {
      label: t('contextMenu.copy'),
      shortcut: 'Ctrl+C',
      icon: 'content_copy',
      disabled: false,
      onClick: () => {
        contextMenuStore.copy(machineId, sortedSelectedPrograms.value)
      },
    },
    {
      label: t('contextMenu.paste'),
      shortcut: 'Ctrl+V',
      icon: 'content_paste',
      disabled: !contextMenuStore.isThereCopiedValue.value,
      onClick: () => {
        $commandManager.executeCommand('pasteProgram', { $q }, machineId)
      },
    },
  ],
  [
    {
      label: t('contextMenu.newProgram'),
      category: 'edit',
      shortcut: 'F2',
      icon: 'add',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand('newProgram', { $q })
      },
    },
    {
      label: t('contextMenu.editProgram'),
      shortcut: 'F3',
      icon: 'edit',
      disabled: isMoreThanOneRowSelected.value
      || sortedSelectedPrograms.value.some(
        (row: ProgramTableRow) =>
          row.prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
      ),
      onClick: async () => {
        await navigateTo(`/machine/${machineId}/program/${sortedSelectedPrograms.value[0].programNo}`)
      },
    },
    {
      label: t('contextMenu.deleteProgram'),
      shortcut: 'Delete',
      icon: 'delete',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'deleteProgram',
          { $q },
          sortedSelectedPrograms.value,
          machineId,
        )
      },
    },
    {
      label: t('contextMenu.deleteProgramsFromMachine'),
      icon: '',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'deleteProgramFromMultiMachine',
          { $q },
          sortedSelectedPrograms.value,
        )
      },
    },
    {
      label: t('contextMenu.concatPrograms'),
      shortcut: '',
      icon: '',
      disabled: !isMoreThanOneRowSelected.value,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'concatenatePrograms',
          { $q },
          sortedSelectedPrograms.value,
          machineId,
        )
      },
    },
    {
      label: t('contextMenu.renameProgram'),
      shortcut: '',
      icon: 'edit_note',
      disabled: isMoreThanOneRowSelected.value
      || !!sortedSelectedPrograms.value.find(
        (row: ProgramTableRow) =>
          row.prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
      ),
      onClick: async () => {
        $commandManager.executeCommand(
          'renameProgram',
          { $q },
          machineId,
          sortedSelectedPrograms.value[0].programNo,
        )
      },
    },
    {
      label: t('contextMenu.changeProcessType'),
      shortcut: '',
      icon: '',
      disabled: sortedSelectedPrograms.value.some(
        (row: ProgramTableRow) =>
          row.prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
      ),
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'changeProcessType',
          { $q },
          machineId,
          sortedSelectedPrograms.value,
        )
      },
    },
  ],
  [
    {
      label: t('contextMenu.sendProgram'),
      shortcut: '',
      icon: 'send',
      disabled: hasOnlyOnController.value,
      onClick: async () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'sendProgram',
          { $q },
          sortedSelectedPrograms.value,
          machineId,
          machineName,
        )
      },
    },
    {
      label: t('contextMenu.copyToMachinesAndSend'),
      shortcut: '',
      icon: '',
      disabled: hasOnlyOnController.value,
      onClick: () => {
        const sourceMachine = { id: machineId, name: machineName }
        const selectedRows = editor.selectedPrograms

        $q.dialog({
          component: CMMachineListCopyAndSendDialog,
          componentProps: {
            machineName,
            machineId,

            allMachines: machine.allMachines,
            machineGroups: machine.machineGroups,

            disabledMachineIds: [machineId],
          },
        }).onOk(async ({ machines: targetMachines, pasteOption }: { machines: MachineInfo[], pasteOption: PasteOptions }) => {
          await contextMenuStore.copyAndSendProgramsToMachines(selectedRows, sourceMachine, targetMachines, pasteOption)
          await editor.refreshAllPrograms()
        }).onCancel(() => false)
      },
    },
    {
      label: t('contextMenu.getProgram'),
      shortcut: '',
      icon: 'get_app',
      disabled: false,
      onClick: async () => {
        $commandManager.executeCommand(
          'getProgram',
          { $q },
          machineId,
          sortedSelectedPrograms.value,
        )
      },
    },
  ],
  [
    {
      label: t('contextMenu.addToComparison'),
      shortcut: '',
      icon: 'playlist_add',
      disabled: hasOnlyOnController.value,
      onClick: () => {
        contextMenuStore.addToComparisonBasket(machineId, sortedSelectedPrograms.value)
      },
    },
    {
      label: t('contextMenu.compareWith'),
      shortcut: '',
      icon: 'compare_arrows',
      disabled: !contextMenuStore.comparisonBasketLength() || hasOnlyOnController.value,
      onClick: () => {
        contextMenuStore.addToComparisonBasket(machineId, sortedSelectedPrograms.value)
        contextMenuStore.comparison()
      },
    },
    {
      label: t('contextMenu.clearComparisonBasket'),
      shortcut: '',
      icon: 'clear',
      disabled: !contextMenuStore.comparisonBasketLength(),
      onClick: () => {
        contextMenuStore.clearComparisonBasket()
      },
    },
  ],
  [
    {
      label: t('contextMenu.programVersion'),
      shortcut: '',
      icon: 'info',
      disabled: isMoreThanOneRowSelected.value,
      onClick: async () => {
        const { programNo, name } = sortedSelectedPrograms.value[0]
        $commandManager.executeCommand('programVersionInfo', { $q }, {
          programNo,
          name,
        })
      },
    },
  ],

] as TopbarMenuItem[][])
const ctrl = useKeyModifier('Control')
const shift = useKeyModifier('Shift')

function formatTooltip<T extends Record<string, any>>(row: T, column: QTableColumn<T> & { tooltip?: (value: any, row: any) => string }) {
  const value = typeof column.field === 'function' ? column.field(row) : row[column.field]
  return column.tooltip ? column.tooltip(value, row) : value
}

function isRowSelected(row: ProgramTableRow) {
  return editor.selectedPrograms.some(prg => prg.programNo === row.programNo)
}
function removeSelection(row: ProgramTableRow) {
  editor.selectedPrograms = editor.selectedPrograms.filter(prg => prg.programNo !== row.programNo)
}

function getSelectedString() {
  return t('selectRange', { count: editor.selectedPrograms.length, total: editor.allPrograms.length })
}

function onRowClick(event: Event, row: ProgramTableRow) {
  const pointer = event as PointerEvent

  if (pointer.button === 2) { // Right click
    if (!isRowSelected(row)) {
      editor.selectedPrograms = [row]
    }
    return
  }

  if (ctrl.value) {
    if (isRowSelected(row)) {
      removeSelection(row)
    } else {
      editor.selectedPrograms.push(row)
    }
    return
  }

  if (shift.value) {
    nextTick(() => {
      const tableRows = tableRef.value.filteredSortedRows
      const firstIndex = Math.min(
        tableRows.indexOf(editor.selectedPrograms[0]),
        tableRows.indexOf(row),
      )
      const lastIndex = Math.max(
        tableRows.indexOf(editor.selectedPrograms[0]),
        tableRows.indexOf(row),
      )
      editor.selectedPrograms = tableRows.slice(firstIndex, lastIndex + 1)
    })
    return
  }

  // Default: Left or middle click
  editor.selectedPrograms = [row]
}

async function onRowDoubleClick(event: Event, row: ProgramTableRow) {
  const target = event.target as HTMLElement

  if (target.closest('.q-checkbox'))
    return

  if (row.prgState !== ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
    await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
  }
}

function handleContextMenu(event: Event, row: ProgramTableRow) {
  event.preventDefault()
  onRowClick(event, row)
}

function getRowStyle(row: ProgramTableRow) {
  const mode = isDark.value ? 'dark' : 'light'

  return {
    color:
      PROGRAM_STATUS_COLORS[row.prgState]?.[mode]
      ?? PROGRAM_STATUS_COLORS[ProgramStatus.EXISTS_ON_BOTH][mode],
  }
}

onBeforeMount(async () => {
  editor.isLoading = true

  if (machine.isMachineDisabled(machineId)) {
    await machine.selectFirstUsableMachine()
    notifyError(t('machineNotUsable', { machineId }))
    editor.isLoading = false
    return
  }

  await machine.loadMachine(machineId)
  await editor.fetchCommandTypes(machineId)

  await editor.refreshAllPrograms().then(() => {
    editor.isLoading = false
  })

  machineStatusStore.checkMachineStatus(machineId, machineName, { notifyOnError: false })
})

onUnmounted(() => {
  editor.selectedPrograms = []
})
</script>

<template>
  <div>
    <div v-if="editor.isLoading" class="loading-container bg-gray-3 bg-opacity-10 dark:bg-dark-2 dark:bg-opacity-10">
      <LoadingSpinner />
    </div>
    <div class="custom-page select-none relative">
      <QTable
        ref="tableRef"
        v-model:selected="editor.selectedPrograms"
        :rows="filteredPrograms"
        :columns="columns"
        row-key="programNo"
        :rows-per-page-options="[0]"
        class="program-table bg-gray-1 dark:bg-dark-4"
        selection="multiple"
        :selected-rows-label="getSelectedString"
        dense
        flat
        table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
        table-header-class="bg-gray-1 dark:bg-dark-4"
        table-class="bg-gray-1 dark:bg-dark-4"
        @row-click="onRowClick"
        @row-dblclick="onRowDoubleClick"
        @row-contextmenu="handleContextMenu"
      >
        <template #top>
          <QInput
            v-model="searchFilter"
            class="w-xs"
            :placeholder="t('search')"
            autocomplete="false"
            debounce="100"
            clearable
            outlined
            dense
          >
            <template #prepend>
              <QIcon name="search" />
            </template>
          </QInput>
          <QSpace />
          <ProgramFilterButton />
        </template>
        <template #body-cell="props">
          <QTd
            :props="props"
            :style="getRowStyle(props.row)"
          >
            <template v-if="typeof props.value === 'boolean'">
              <QIcon
                :name="props.value ? 'check' : ''"
                color="positive"
                size="xs"
              />
            </template>
            <template v-else>
              {{ props.value }}
            </template>
            <QTooltip v-if="props.col.tooltip">
              {{ formatTooltip(props.row, props.col) }}
            </QTooltip>
          </QTd>
        </template>
      </QTable>

      <q-menu
        touch-position
        context-menu
        :transition-duration="0"
      >
        <ProgramContextMenu :items="contextMenuOptions" />
      </q-menu>
    </div>

    <ProgramStatusPopup
      :statuses="PROGRAM_STATUS_COLORS"
    />
  </div>
</template>

<style lang="postcss" scoped>
.menu-icon-class.q-item__section--avatar {
  min-width: auto;
}
.custom-page {
  margin: 20px;
  min-height: fit-content !important;
}

.loading-container {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.custom-scrollbar {
  width: 300px;
  height: 200px;
  overflow-y: scroll; /* Enable vertical scrolling */
  padding: 10px;
  border: 1px solid #ccc;
}

.program-table {
  height: calc(100vh - 10rem);
  user-select: none;
}
</style>
