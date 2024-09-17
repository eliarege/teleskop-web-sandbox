<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useFuse } from '@vueuse/integrations/useFuse'
import { EliarModal, LoadingSpinner } from '@teleskop/ui'
import type { QTableColumn } from 'quasar'
import { useQuasar } from 'quasar'
import { onKeyStroke } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { capitalize } from '~/shared/utils'
import type { ProgramFilter, ProgramHeader, ProgramTable } from '~/shared/types'
import { ProgramStateColors, ProgramStatus } from '~/shared/constants'
import { clearFilter, filterToQuery, formatDuration, getExistingFilter } from '~/composables/utils'
import { contextMenuStore } from '~/utils/context-menu'
import { useContextBar } from '~/composables/useContextBar'
import { useEditorStore } from '~/composables/editor'

definePageMeta({
  path: '/machine/:machine_id',
})

const { $commandManager } = useNuxtApp()
const { t, locale } = useI18n()
const { dark } = useQuasar()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const machineId = Number(route.params.machine_id)
const tableRef = ref()
const isProgramFilterExists = ref(getExistingFilter())
const tt = (key: string) => toRef(() => t(key))
contextMenuStore.setCtx({ t })

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('newProgram', { $q })
})

onKeyStroke('F4', (event: KeyboardEvent) => {
  if (editor.selectedPrograms.length === 1) {
    event.preventDefault()
    router.push(`${machineId}/program/${editor.selectedPrograms[0].programNo}`)
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
  if (event.ctrlKey) {
    event.preventDefault()
    $commandManager.executeCommand('printProgram', { $q })
  }
})

onKeyStroke(['l', 'L'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    $commandManager.executeCommand('printProgramList', { $q })
  }
})

onKeyStroke(['r', 'R'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    editor.onReset()
  }
})

onKeyStroke(['a', 'A'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    $commandManager.executeCommand('newProgram', { $q })
  }
})

onKeyStroke(['c', 'C'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    contextMenuStore.copy(editor.selectedPrograms, machineId)
  }
})

onKeyStroke(['v', 'V'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    contextMenuStore.paste(machineId)
  }
})

onKeyStroke(['Enter'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (editor.selectedPrograms.length === 1)
    router.push(`${machineId}/program/${editor.selectedPrograms[0].programNo}`)
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('deleteProgram', { $q }, editor.selectedPrograms, editor.machine.id)
})

onKeyStroke('Escape', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.selectedPrograms = []
  editor.popupCommandDetailVisible = false
  editor.popupCommandListVisible = false
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

const PATH_RE = /^\/machine\/([^/]+?)\/?$/

const fullMatch = computed(() => PATH_RE.test(route.path))
watch(fullMatch, async () => {
  if (fullMatch.value)
    await editor.fetchAllPrograms()
})

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
    shortcut: 'F4',
    icon: 'edit',
    disable: isMoreThanOneRowSelected.value || !editor.selectedPrograms.length,
    onClick() {
      router.push(`${machineId}/program/${editor.selectedPrograms[0]?.programNo}`)
    },
  },
  {
    label: t('menu.deleteProgram'),
    originalLabel: t('menu.deleteProgram'),
    tooltip: t('menu.deleteProgram'),
    shortcut: 'Ctrl+Del',
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
      shortcut: '',
      icon: 'content_copy',
      disabled: false,
      onClick: () => {
        contextMenuStore.copy(editor.selectedPrograms, machineId)
      },
    },
    {
      label: tt('contextMenu.paste'),
      shortcut: '',
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
      shortcut: 'F4',
      icon: 'edit',
      disabled: isMoreThanOneRowSelected.value,
      onClick: async () => {
        await navigateTo(`${machineId}/program/${editor.selectedPrograms[0].programNo}`)
      },
    },
    {
      label: tt('contextMenu.deleteProgram'),
      shortcut: 'Ctrl+Del',
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
        contextMenuStore.addToComparisonBasket(editor.selectedPrograms)
      },
    },
    {
      label: tt('contextMenu.compareWith'),
      shortcut: '',
      icon: 'compare_arrows',
      disabled: !contextMenuStore.comparisonBasketLength(),
      onClick: () => {
        contextMenuStore.addToComparisonBasket(editor.selectedPrograms)
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
        versions.value = await contextMenuStore.fetchVersions(editor.selectedPrograms[0].programNo, machineId)
        versionDialogVisible.value = true
      },
    },
  ],

] as TopbarMenuItem[][])
const ctrl = useKeyModifier('Control')
const shift = useKeyModifier('Shift')

function handleFilterClick() {
  // TODO: Context cannot be provided by executor
  $commandManager.executeCommand(
    'filterPrograms',
    { $q, fetchPrograms, isProgramFilterExists },
  )
}
function handleClearFilterClick() {
  clearFilter()
  isProgramFilterExists.value = false
  fetchPrograms()
}

function formatValue<T extends Record<string, any>>(row: T, column: QTableColumn<T>) {
  const value = typeof column.field === 'function' ? column.field(row) : row[column.field]
  return column.format ? column.format(value, row) : value
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

function handleRowColor(row: ProgramHeader) {
  if (0) { // User is not logged in //FIXME:
    return 'grey'
  } else if (row.isChanged)
    return dark.isActive ? ProgramStateColors.CHANGED_ON_TELESKOP_DARK : ProgramStateColors.CHANGED_ON_TELESKOP
  else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
    return dark.isActive ? ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER_DARK : ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER
  } else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE) {
    return dark.isActive ? ProgramStateColors.EXISTS_ONLY_ON_DATABASE_DARK : ProgramStateColors.EXISTS_ONLY_ON_DATABASE
  } else {
    const changeDate = (new Date(row.updatedAt || 0)).getTime()
    const changeDateTBB = (new Date(row.updatedAtTBB || 0)).getTime()
    const interval = (changeDateTBB - changeDate) / 1000

    if (interval > 600 || interval < -600) {
      if (row.tbbProgramChangedEvent) {
        // change info came with mm Idk what does it mean
      }
      if (changeDateTBB > changeDate)
        return dark.isActive ? ProgramStateColors.CHANGED_ON_MACHINE_DARK : ProgramStateColors.CHANGED_ON_MACHINE // Program  changed on machine
      else
        return dark.isActive ? ProgramStateColors.CHANGED_ON_TELESKOP_DARK : ProgramStateColors.CHANGED_ON_TELESKOP // Program changed on teleskop
    } else {
      return dark.isActive ? ProgramStateColors.NO_CHANGES_DARK : ProgramStateColors.NO_CHANGES
    }
  }
}

function getSelectedString() {
  return t('selectRange', { count: editor.selectedPrograms.length, total: editor.allPrograms.length })
}

const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

function onRowClick(event: Event, row: ProgramTable) {
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
  } else if (!isRowSelected(row)) {
    editor.selectedPrograms = [row]
  }
}

async function onRowDoubleClick(event: Event, row: ProgramTable) {
  await navigateTo(`${machineId}/program/${row.programNo}`)
  showContextMenu.value = false
}

function handleContextMenu(event: Event, row: ProgramTable) {
  event.preventDefault()

  onRowClick(event, row)
  showContextMenu.value = true
}
</script>

<template>
  <div class="custom-page select-none relative">
    <div v-if="editor.isLoading" class="loading-container ">
      <LoadingSpinner :has-background="false" />
    </div>
    <div v-if="fullMatch">
      <QTable
        ref="tableRef"
        v-model:selected="editor.selectedPrograms"
        :rows="filteredPrograms"
        :columns="columns"
        row-key="programNo"
        :rows-per-page-options="[0]"
        class="no-selected h-80vh"
        selection="multiple"
        :selected-rows-label="getSelectedString"
        :filter="filter"
        dense
        flat
        @row-click="onRowClick"
        @row-dblclick="onRowDoubleClick"
        @row-contextmenu="handleContextMenu"
      />

      <q-menu
        v-model="showContextMenu"
        touch-position
        context-menu
        :transition-duration="0"
        :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
      >
        <ProgramContextMenu :items="contextMenuOptions" />
      </q-menu>
    </div>
    <div v-else>
      <NuxtPage />
    </div>
  </div>

  <CMProgramStateDialog v-if="!route.params.program_no" />

  <EliarModal v-if="versionDialogVisible">
    <CMVersionDialog
      :rows="versions"
      :machine-id="machineId"
      :program-no="editor.selectedPrograms[0].programNo"
      @close="versionDialogVisible = false"
      @delete="e => handleVersionDelete(e)"
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
</style>
