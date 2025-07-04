<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useFuse } from '@vueuse/integrations/useFuse'
import type { QTableColumn } from 'quasar'
import { useQuasar } from 'quasar'
import { onKeyStroke } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { capitalize } from '~/shared/utils'
import type { ContextBarButtons, ProgramItem, ProgramTable } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { formatDuration } from '~/composables/utils'
import { contextMenuStore } from '~/utils/context-menu'
import { useContextBar } from '~/composables/useContextBar'
import { useEditorStore } from '~/composables/editor'

definePageMeta({
  path: '/machine/:machine_id',
})

const { $commandManager } = useNuxtApp()
const { t, locale } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const filter = useProgramFilterStore()
const machineId = Number(route.params.machine_id)
const tableRef = ref()
const tt = (key: string) => toRef(() => t(key))
contextMenuStore.setCtx({ t, router })

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('newProgram', { $q })
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (editor.selectedPrograms.length === 1) {
    event.preventDefault()
    navigateTo(`/machine/${machineId}/program/${editor.selectedPrograms[0].programNo}`)
  }
})

onKeyStroke('F5', async (event: KeyboardEvent) => {
  event.preventDefault()
  editor.isLoading = true
  await editor.fetchAllPrograms()
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
//     await editor.fetchMachine(machineId)
//   }
// })

onKeyStroke(['a', 'A'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    editor.selectedPrograms = editor.allPrograms
  }
})

onKeyStroke(['c', 'C'], (event: KeyboardEvent) => {
  if (event.ctrlKey && editor.selectedPrograms.length && !isActiveElementEditable()) {
    event.preventDefault()
    contextMenuStore.copy(machineId, editor.selectedPrograms)
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
    if (editor.selectedPrograms.length >= 1)
      navigateTo(`/machine/${machineId}/program/${editor.selectedPrograms[0].programNo}`)
  }
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('deleteProgram', { $q }, editor.selectedPrograms, editor.machine.id)
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
  const currentIndex = editor.allPrograms.indexOf(editor.selectedPrograms[0])

  if (currentIndex > 0) {
    const newSelection = editor.allPrograms[currentIndex - 1]
    editor.selectedPrograms = [newSelection]
  }
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  if (isActiveElementEditable())
    return

  event.preventDefault()
  const currentIndex = editor.allPrograms.indexOf(editor.selectedPrograms[0])

  if (currentIndex < editor.allPrograms.length - 1) {
    const newSelection = editor.allPrograms[currentIndex + 1]
    editor.selectedPrograms = [newSelection]
  }
})

if (filter.existingFilter.clearOnChange)
  filter.clearFilter()

editor.isLoading = true
if (editor.machine.id !== machineId) {
  await editor.fetchMachine(machineId)
  await editor.fetchCommandTypes(machineId)
}
await editor.fetchAllPrograms().then(() => {
  editor.isLoading = false
})

const versionDialogVisible = ref(false)
const comparisonDialogVisible = ref(false)
const versions = ref([] as Array<any>)
const isMoreThanOneRowSelected = computed(() => editor.selectedPrograms.length > 1)

const searchFilter = ref('')
const debouncedFilter = refDebounced(searchFilter, 250)

const { results: filterResults } = useFuse(debouncedFilter, () => editor.allPrograms, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['programNo', 'name', 'type'],
  },
})
const filteredPrograms = computed<ProgramTable[]>(() => filterResults.value.map(res => res.item))

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
    disable: isMoreThanOneRowSelected.value || !editor.selectedPrograms.length,
    onClick() {
      navigateTo(`/machine/${machineId}/program/${editor.selectedPrograms[0].programNo}`)
    },
  },
  {
    label: t('menu.deleteProgram'),
    originalLabel: t('menu.deleteProgram'),
    tooltip: t('menu.deleteProgram'),
    shortcut: 'Delete',
    icon: 'delete',
    disable: !editor.selectedPrograms.length,
    onClick() {
      // TODO: Context cannot be provided by executor
      $commandManager.executeCommand(
        'deleteProgram',
        { $q },
        editor.selectedPrograms,
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
    disable: !editor.selectedPrograms.length,
    onClick() {
      contextMenuStore.copy(machineId, editor.selectedPrograms)
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
      $commandManager.executeCommand('refresh', { $q }, machineId)
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
  label: string | Readonly<Ref<string>>
  field: keyof ProgramTable | ((row: ProgramTable) => any)
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  format?: (value: Date, row: ProgramTable) => string
  tooltip?: (value: Date, row: ProgramTable) => string
}

const columns = ref<ProgramTableColumn[]>([
  {
    name: 'programNo',
    label: '#',
    field: 'programNo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'name',
    label: tt('program.name'),
    field: 'name',
    sortable: true,
    align: 'left',
  },
  {
    name: 'duration',
    label: tt('program.theoreticalDuration'),
    field: (value: { duration: number }) => {
      return formatDuration(value.duration)
    },
    sortable: true,
    align: 'center',
  },
  {
    name: 'step_count',
    label: tt('program.stepCount'),
    field: 'stepCount',
    sortable: true,
    align: 'center',
  },
  {
    name: 'type',
    label: tt('program.type'),
    field: 'type',
    sortable: true,
    align: 'center',
  },
  {
    name: 'operator',
    label: tt('program.opMud'),
    field: 'operator',
    sortable: true,
    align: 'center',
  },
  {
    name: 'totalChemReq',
    label: tt('program.totalChemReq'),
    field: 'totalChemReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'totalDyeReq',
    label: tt('program.totalDyeReq'),
    field: 'totalDyeReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'manChemReq',
    label: tt('program.manChemReq'),
    field: 'manChemReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'autoChemReq',
    label: tt('program.autoChemReq'),
    field: 'autoChemReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'autoDyeReq',
    label: tt('program.autoDyeReq'),
    field: 'autoDyeReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'manDyeReq',
    label: tt('program.manDyeReq'),
    field: 'manDyeReq',
    sortable: false,
    align: 'center',
  },
  {
    name: 'updated_at',
    label: tt('program.updated'),
    field: 'updatedAt',
    sortable: true,
    align: 'right',
    format,
    tooltip,
  },
])

const contextMenuOptions = computed(() => [
  [
    {
      label: tt('contextMenu.copy'),
      shortcut: 'Ctrl+C',
      icon: 'content_copy',
      disabled: false,
      onClick: () => {
        contextMenuStore.copy(machineId, editor.selectedPrograms)
      },
    },
    {
      label: tt('contextMenu.paste'),
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
      label: tt('contextMenu.newProgram'),
      category: 'edit',
      shortcut: 'F2',
      icon: 'add',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand('newProgram', { $q })
      },
    },
    {
      label: tt('contextMenu.editProgram'),
      shortcut: 'F3',
      icon: 'edit',
      disabled: isMoreThanOneRowSelected.value,
      onClick: async () => {
        await navigateTo(`/machine/${machineId}/program/${editor.selectedPrograms[0].programNo}`)
      },
    },
    {
      label: tt('contextMenu.deleteProgram'),
      shortcut: 'Delete',
      icon: 'delete',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'deleteProgram',
          { $q },
          editor.selectedPrograms,
          machineId,
        )
      },
    },
    {
      label: tt('contextMenu.deleteProgramsFromMachine'),
      icon: '',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'deleteProgramFromMultiMachine',
          { $q },
          editor.selectedPrograms,
        )
      },
    },
    {
      label: tt('contextMenu.concatPrograms'),
      shortcut: '',
      icon: '',
      disabled: !isMoreThanOneRowSelected.value,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'concatenatePrograms',
          { $q },
          editor.selectedPrograms,
          machineId,
        )
      },
    },
    {
      label: tt('contextMenu.changeName'),
      shortcut: '',
      icon: 'edit_note',
      disabled: isMoreThanOneRowSelected.value
      || !!editor.selectedPrograms.find(
        (row: ProgramTable) =>
          row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
      ),
      onClick: async () => {
        $commandManager.executeCommand(
          'changeName',
          { $q },
          machineId,
          editor.selectedPrograms[0].programNo,
        )
      },
    },
    {
      label: tt('contextMenu.changeProcessType'),
      shortcut: '',
      icon: '',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'changeProcessType',
          { $q },
          machineId,
          editor.selectedPrograms.map((row: ProgramItem) => {
            return { machineId, programNo: row.programNo, name: row.name }
          }),
        )
      },
    },
  ],
  [
    {
      label: tt('contextMenu.sendProgram'),
      shortcut: '',
      icon: 'send',
      disabled: false,
      onClick: async () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'sendProgram',
          { $q },
          editor.selectedPrograms,
          machineId,
        )
      },
    },
    {
      label: tt('contextMenu.copyToMachinesAndSend'),
      shortcut: '',
      icon: '',
      disabled: false,
      onClick: () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'copyAndSend',
          { $q },
          editor.selectedPrograms,
          machineId,
        )
      },
    },
    {
      label: tt('contextMenu.getProgram'),
      shortcut: '',
      icon: '',
      disabled: false,
      onClick: async () => {
        $commandManager.executeCommand(
          'fetchProgram',
          { $q },
          editor.selectedPrograms,
          machineId,
        )
      },
    },
  ],
  [
    {
      label: tt('contextMenu.addToComparison'),
      shortcut: '',
      icon: 'playlist_add',
      disabled: false,
      onClick: () => {
        contextMenuStore.addToComparisonBasket(machineId, editor.selectedPrograms)
      },
    },
    {
      label: tt('contextMenu.compareWith'),
      shortcut: '',
      icon: 'compare_arrows',
      disabled: !contextMenuStore.comparisonBasketLength(),
      onClick: () => {
        contextMenuStore.addToComparisonBasket(machineId, editor.selectedPrograms)
        // comparisonDialogVisible.value = true
        contextMenuStore.comparison()
      },
    },
    {
      label: tt('contextMenu.clearComparisonBasket'),
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
      label: tt('contextMenu.programVersion'),
      shortcut: '',
      icon: 'info',
      disabled: isMoreThanOneRowSelected.value,
      onClick: async () => {
        await fetchVersions(editor.selectedPrograms[0].programNo)
        versionDialogVisible.value = true
      },
    },
  ],

] as TopbarMenuItem[][])
const ctrl = useKeyModifier('Control')
const shift = useKeyModifier('Shift')

async function fetchVersions(programNo: number) {
  versions.value = await contextMenuStore.fetchVersions(programNo, machineId)
}

function formatTooltip<T extends Record<string, any>>(row: T, column: QTableColumn<T> & { tooltip?: (value: any, row: any) => string }) {
  const value = typeof column.field === 'function' ? column.field(row) : row[column.field]
  return column.tooltip ? column.tooltip(value, row) : value
}

function isRowSelected(row: ProgramTable) {
  return editor.selectedPrograms.includes(row)
}
function removeSelection(row: ProgramTable) {
  editor.selectedPrograms = editor.selectedPrograms.filter(r => r !== row)
}

async function handleVersionDelete(deleteVersions: any[]) {
  editor.isLoading = true
  await contextMenuStore.deleteVersion(deleteVersions, machineId)
  await editor.fetchAllPrograms()
  versions.value = await contextMenuStore.fetchVersions(editor.selectedPrograms[0].programNo, machineId)
  editor.isLoading = false
}

function getSelectedString() {
  return t('selectRange', { count: editor.selectedPrograms.length, total: editor.allPrograms.length })
}

function onRowClick(event: Event, row: ProgramTable) {
  const pointer = event as PointerEvent

  if (pointer.button === 2) { // Right click
    if (!isRowSelected(row))
      editor.selectedPrograms = [row]
    return
  }

  if (ctrl.value) {
    isRowSelected(row) ? removeSelection(row) : editor.selectedPrograms.push(row)
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

async function onRowDoubleClick(event: Event, row: ProgramTable) {
  const target = event.target as HTMLElement

  if (target.closest('.q-checkbox'))
    return

  if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE || row.programState === ProgramStatus.EXISTS_ON_BOTH)
    await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
}

function handleContextMenu(event: Event, row: ProgramTable) {
  event.preventDefault()
  onRowClick(event, row)
}

function handleRowClass(row: ProgramTable): string {
  if (row.isChanged)
    return 'changed-on-teleskop'
  if (row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER)
    return 'only-on-controller'
  if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE)
    return 'only-on-teleskop'
  if (row.programState === ProgramStatus.EXISTS_ON_BOTH) {
    if (row.updatedAtTBB && row.updatedAt) {
      if (row.updatedAtTBB === row.updatedAt)
        return 'no-changes'
      return row.updatedAtTBB > row.updatedAt ? 'changed-on-machine' : 'changed-on-teleskop'
    }
  }
  return 'no-changes'
}
</script>

<template>
  <div v-if="editor.isLoading" class="loading-container bg-gray-3 bg-opacity-10 dark:bg-dark-2 dark:bg-opacity-10">
    <LoadingSpinner />
  </div>
  <div class="custom-page select-none relative">
    <DevOnly>
      <div class="flex flex-col color-gray-5 text-3">
        <span> {{ `selectedPrograms: ${editor.selectedPrograms.map(p => p.programNo).join(', ')}` }} </span>
        <span> {{ `copiedPrograms: ${contextMenuStore.getCopiedValues().map(p => `${p.machineId}-${p.programNo}-${p.name}`).join(', ')}` }} </span>
      </div>
    </DevOnly>
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
      :filter="searchFilter"
      dense
      flat
      table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
      table-header-class="bg-gray-1 dark:bg-dark-4"
      table-class="bg-gray-1 dark:bg-dark-4"
      @row-click="onRowClick"
      @row-dblclick="onRowDoubleClick"
      @row-contextmenu="handleContextMenu"
    >
      <template #body-cell="{ value, row, col }">
        <QTd
          :class="[handleRowClass(row), col.__tdClass?.(row)]"
          :style="col.__tdStyle?.(row)"
        >
          <template v-if="typeof value === 'boolean'">
            <QIcon
              :name="value ? 'check' : ''"
              color="positive"
              size="xs"
            />
          </template>
          <template v-else>
            {{ value }}
          </template>
          <QTooltip v-if="col.tooltip">
            {{ formatTooltip(row, col) }}
          </QTooltip>
        </QTd>
      </template>
      <template #top>
        <QInput
          v-model="searchFilter"
          class="q-pa-md w-xs"
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
    </QTable>

    <q-menu
      touch-position
      context-menu
      :transition-duration="0"
    >
      <ProgramContextMenu :items="contextMenuOptions" />
    </q-menu>
  </div>

  <CMProgramStateDialog v-if="!route.params.program_no" />

  <EliarModal v-if="versionDialogVisible">
    <CMVersionDialog
      :rows="versions"
      :machine-id="machineId"
      :program-no="editor.selectedPrograms[0].programNo"
      @close="versionDialogVisible = false"
      @delete="e => handleVersionDelete(e)"
      @active-version-changed="editor.fetchAllPrograms(), fetchVersions(editor.selectedPrograms[0].programNo)"
    />
  </EliarModal>

  <EliarModal v-if="comparisonDialogVisible">
    <CMComparisonDialog
      type="comparison"
      @close="comparisonDialogVisible = false"
    />
  </EliarModal>
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
  height: 80vh;
  user-select: none;
}
</style>
