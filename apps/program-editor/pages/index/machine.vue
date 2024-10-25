<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useFuse } from '@vueuse/integrations/useFuse'
import { EliarModal, LoadingSpinner } from '@teleskop/ui'
import type { QTableColumn } from 'quasar'
import { event, useQuasar } from 'quasar'
import { onKeyStroke } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { capitalize } from '~/shared/utils'
import type { ProgramTable } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { clearFilter, filterToQuery, formatDuration, getExistingFilter } from '~/composables/utils'
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
const machineId = Number(route.params.machine_id)
const tableRef = ref()
const isProgramFilterExists = ref(getExistingFilter())
const tt = (key: string) => toRef(() => t(key))
contextMenuStore.setCtx({ t, router })
const devMode = import.meta.dev

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
  await editor.fetchAllPrograms().then(() => {
    editor.isLoading = false
  })
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

onKeyStroke(['r', 'R'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    editor.onReset()
  }
})

onKeyStroke(['a', 'A'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    editor.selectedPrograms = editor.allPrograms
  }
})

onKeyStroke(['c', 'C'], (event: KeyboardEvent) => {
  if (event.ctrlKey && editor.selectedPrograms.length && !isActiveElementEditable()) {
    event.preventDefault()
    contextMenuStore.copy(editor.selectedPrograms, machineId)
  }
})

onKeyStroke(['v', 'V'], (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    $commandManager.executeCommand('pasteProgram', { $q }, machineId)
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
  editor.popupCommandDetailVisible = false
  editor.popupCommandListVisible = false
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

editor.isLoading = true
await editor.fetchTeleskopSettings()
await editor.fetchMachine(machineId)
await editor.fetchCommandTypes(machineId)
await editor.fetchAllPrograms()
await editor.fetchAllProcessTypes().then(() => {
  editor.isLoading = false
})

const versionDialogVisible = ref(false)
const comparisonDialogVisible = ref(false)
const versions = ref([] as Array<any>)
const isMoreThanOneRowSelected = computed(() => editor.selectedPrograms.length > 1)

const filter = ref('')
const debouncedFilter = refDebounced(filter, 250)

const { results: filterResults } = useFuse(debouncedFilter, () => editor.allPrograms, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['programNo', 'name', 'type'],
  },
})
const filteredPrograms = computed<ProgramTable[]>(() => filterResults.value.map(res => res.item))

const buttons = computed(() => [
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
    disable: isMoreThanOneRowSelected.value || !editor.selectedPrograms.length,
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
      contextMenuStore.copy(editor.selectedPrograms, machineId)
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
        contextMenuStore.copy(editor.selectedPrograms, machineId)
      },
    },
    {
      label: tt('contextMenu.paste'),
      shortcut: 'Ctrl+V',
      icon: 'content_paste',
      disabled: !contextMenuStore.isThereCopiedValue.value,
      onClick: () => {
        $commandManager.executeCommand(
          'pasteProgram',
          { $q },
          machineId,
        )
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
        (row: any) =>
          row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
      ),
      onClick: async () => {
        // TODO: Context cannot be provided by executor
        $commandManager.executeCommand(
          'changeName',
          { $q },
          editor.selectedPrograms,
          machineId,
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
          editor.selectedPrograms,
          machineId,
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
        // TODO: Context cannot be provided by executor
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
        contextMenuStore.addToComparisonBasket(editor.selectedPrograms, machineId)
      },
    },
    {
      label: tt('contextMenu.compareWith'),
      shortcut: '',
      icon: 'compare_arrows',
      disabled: !contextMenuStore.comparisonBasketLength(),
      onClick: () => {
        contextMenuStore.addToComparisonBasket(editor.selectedPrograms, machineId)
        // comparisonDialogVisible.value = true
        contextMenuStore.comparison()
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
function handleFilterClick() {
  $commandManager.executeCommand(
    'filterPrograms',
    { $q, filteredPrograms, isProgramFilterExists },
  )
}

function handleClearFilterClick() {
  clearFilter()
  isProgramFilterExists.value = false
  editor.fetchAllPrograms()
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

function onRowClick(event: MouseEvent, row: ProgramTable) {
  if (ctrl.value) {
    if (isRowSelected(row)) {
      removeSelection(row)
    } else
      editor.selectedPrograms.push(row)
  } else if (shift.value) {
    nextTick(() => {
      const tableRows = tableRef.value.filteredSortedRows
      let firstIndex = tableRows.indexOf(editor.selectedPrograms[0])
      let lastIndex = tableRows.indexOf(row)
      if (firstIndex > lastIndex) {
        [firstIndex, lastIndex] = [lastIndex, firstIndex]
      }
      editor.selectedPrograms = tableRows.slice(firstIndex, lastIndex + 1)
    })
  } else if (event.button !== 2) { // not right click
      editor.selectedPrograms = [row]
  } else if (event.button === 2) { // right click
      editor.selectedPrograms.push(row)
  }
}

async function onRowDoubleClick(event: Event, row: ProgramTable) {
  await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
}

function handleContextMenu(event: Event, row: ProgramTable) {
  event.preventDefault()
  onRowClick(event, row)
}

function handleRowClass(row: ProgramTable): string {
  if (row.isChanged)
    return 'changed-on-teleskop'

  else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER)
    return 'only-on-controller'

  else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE)
    return 'only-on-teleskop'

  else {
    const changeDate = (new Date(row.updatedAt || 0)).getTime()
    const changeDateTBB = (new Date(row.updatedAtTBB || 0)).getTime()
    const interval = (changeDateTBB - changeDate) / 1000

    if (Math.abs(interval) > 600) {
      return changeDateTBB > changeDate ? 'changed-on-machine' : 'changed-on-teleskop'
    }

    return 'no-changes'
  }
}
</script>

<template>
  <div class="custom-page select-none relative">
    <div v-if="editor.isLoading" class="loading-container">
      <LoadingSpinner :has-background="false" />
    </div>
    <div v-if="devMode" class="flex flex-col color-gray-5 text-3">
      <span> {{ `selectedPrograms: ${editor.selectedPrograms.map(p => p.programNo).join(', ')}` }} </span>
      <span> {{ `copiedPrograms: ${contextMenuStore.getCopiedValues()?.map(p => p.program.programNo).join(', ')}` }} </span>
    </div>
    <QTable
      ref="tableRef"
      v-model:selected="editor.selectedPrograms"
      :rows="filteredPrograms"
      :columns="columns"
      row-key="programNo"
      :rows-per-page-options="[0]"
      class="program-table"
      selection="multiple"
      :selected-rows-label="getSelectedString"
      :filter="filter"
      dense
      flat
      table-header-style="position: sticky; top: 0; z-index: 1; background-color: #f5f5f5; height: 50px;"
      bottom-row-style="background-color: #ff0000; color: white;"
      table-style="border-radius: 10px;"
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
          v-model="filter"
          clear-icon="close"
          class="q-pa-md w-xs"
          dense
          autocomplete="false"
          debounce="100"
          outlined
          icon
          :placeholder="t('search')"
        >
          <template #prepend>
            <QIcon name="search" />
          </template>

          <template #append>
            <QBtn
              v-if="filter"
              icon="close"
              flat
              round
              dense
              size="sm"
              @click="filter = ''"
            />
          </template>
        </QInput>
        <QSpace />
        <QBtn
          :icon="isProgramFilterExists ? 'filter_alt_off' : 'filter_alt'"
          color="grey-8"
          flat
          @click="isProgramFilterExists ? handleClearFilterClick() : handleFilterClick()"
        />
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

  <EliarModal v-if="editor.popupTempTimeGraphVisible">
    <CMTempTimeGraphDialog />
  </EliarModal>

  <EliarModal v-if="editor.popupStepCommandGraphVisible">
    <CMStepCommandGraphDialog />
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  background-color: rgb(229, 231, 235, 0.2);
}

.custom-scrollbar {
  width: 300px;
  height: 200px;
  overflow-y: scroll; /* Enable vertical scrolling */
  padding: 10px;
  border: 1px solid #ccc;
}

.program-table :deep(.q-table__bottom) {
  background-color: #f5f5f5;
}

.program-table {
  height: 80vh;
  border-radius: 10px;
  user-select: none;
}
</style>
