<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useFuse } from '@vueuse/integrations/useFuse'
import { EliarModal, LoadingSpinner } from '@teleskop/ui'
import type { QTableColumn } from 'quasar'
import { useQuasar } from 'quasar'
import { onKeyStroke } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { capitalize } from '~/server/utils'
import type { ProgramFilter, ProgramHeader, ProgramTable } from '~/shared/types'
import { ProgramStateColors, ProgramStatus } from '~/shared/constants'
import type { AppCommand } from '~/composables/new.commands'
import { clearFilter, filterToQuery, formatDuration, getExistingFilter } from '~/composables/utils'
import { contextMenuStore } from '~/shared/utils'
import { useContextBar } from '~/composables/useContextBar'
import { useEditorStore } from '~/composables/editor'
import CMNewProgramDialog from '~/components/CMNewProgramDialog.vue'

const { $commandManager } = useNuxtApp()
const { t, locale } = useI18n()
const { dark } = useQuasar()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const machineId = Number(route.params.machine_id)
const isProgramFilterExists = ref(getExistingFilter())
const programs = ref([] as ProgramHeader[])
const tt = (key: string) => toRef(() => t(key))
contextMenuStore.setCtx({ t })
onKeyStroke('F2', (event: KeyboardEvent) => {
  if (!route.params.program_no) {
    event.preventDefault()
    editor.popupNewProgramVisible = true
  } else {
    event.preventDefault()
    editor.newStep()
  }
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (route.params.program_no) {
    event.preventDefault()
    editor.newParallelStep()
  }
})

onKeyStroke('F4', (event: KeyboardEvent) => {
  if (editor.selectedPrograms.length === 1) {
    event.preventDefault()
    router.push(`/machine/${editor.machine.id}/program/${editor.selectedPrograms[0].programNo}`)
  }
})

onKeyStroke('F5', (event: KeyboardEvent) => {
  event.preventDefault()
  fetchPrograms()
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

onKeyStroke(['s', 'S'], (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    event.preventDefault()
    editor.onSubmit()
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
    editor.popupNewProgramVisible = true
  }
})

onKeyStroke(['Enter'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (!route.params.program_no) {
    if (editor.selectedPrograms.length === 1)
      router.push(`/machine/${editor.machine.id}/program/${editor.selectedPrograms[0].programNo}`)
  } else {
    editor.scrollPage(editor.selectedStep, true)
  }
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (route.params.program_no) {
    if (event.ctrlKey)
      editor.deleteParallelStep()
    else
      editor.deleteStep()
  }
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (route.params.program_no) {
    if (event.shiftKey) {
      if (between(editor.selectedParallelStep + 1, 0, editor.program.steps[editor.selectedStep].parallelCommands.length - 1)) {
        editor.selectedParallelStep = editor.selectedParallelStep + 1
      }
    } else {
      if (between(editor.selectedStep + 1, 0, editor.program.steps.length - 1)) {
        editor.selectedStep = editor.selectedStep + 1
      }
    }
    editor.scrollPage(editor.selectedStep)
  }
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  event.preventDefault()
  if (route.params.program_no) {
    if (event.shiftKey) {
      if (between(editor.selectedParallelStep - 1, 0, editor.program.steps[editor.selectedStep].parallelCommands.length - 1)) {
        editor.selectedParallelStep = editor.selectedParallelStep - 1
      }
    } else {
      if (between(editor.selectedStep - 1, 0, editor.program.steps.length - 1)) {
        editor.selectedStep = editor.selectedStep - 1
      }
    }
    editor.scrollPage(editor.selectedStep)
  }
})

onKeyStroke('Escape', (event: KeyboardEvent) => {
  event.preventDefault()
  if (route.params.program_no) {
    editor.selectedStep = -1
    editor.selectedParallelStep = -1
  } else {
    editor.selectedPrograms = []
    editor.popupCommandDetailVisible = false
    editor.popupCommandListVisible = false
    editor.popupNewProgramVisible = false
    editor.popupSaveAsProgramVisible = false
  }
})

async function fetchPrograms(filter?: ProgramFilter) {
  const { fetch } = useKeycloak()
  let query
  const checkAnyExistingFilter = getExistingFilter()
  if (checkAnyExistingFilter) {
    query = filterToQuery(checkAnyExistingFilter)
  }
  if (filter) {
    query = filterToQuery(filter)
  }
  programs.value = await fetch(`/api/machine/${machineId}/program?${query || ''}`)
}

editor.isLoading = true
await editor.fetchMachine(Number(route.params.machine_id))
await editor.fetchAllPrograms(Number(route.params.machine_id))
await fetchPrograms().then(() => {
  editor.isLoading = false
})
editor.program = editor.createProgram()

const versionDialogVisible = ref(false)
const comparisonDialogVisible = ref(false)
const versions = ref([] as Array<any>)
const isMoreThanOneRowSelected = computed(() => editor.selectedPrograms.length > 1)

const buttons = computed(() => [
  { label: t('menu.newProgram'), originalLabel: t('menu.newProgram'), tooltip: t('menu.newProgram'), shortcut: 'F2', icon: 'add_circle_outline', onClick() {
    editor.popupNewProgramVisible = true
  } },
  { label: t('menu.editProgram'), originalLabel: t('menu.editProgram'), tooltip: t('menu.editProgram'), shortcut: 'F3', icon: 'edit', disable: isMoreThanOneRowSelected.value || !editor.selectedPrograms.length, onClick() {
    router.push(`/machine/${machineId}/program/${editor.selectedPrograms[0]?.programNo}`)
  } },
  { label: t('menu.deleteProgram'), originalLabel: t('menu.deleteProgram'), tooltip: t('menu.deleteProgram'), shortcut: 'Ctrl+Del', icon: 'delete', disable: isMoreThanOneRowSelected.value || !editor.selectedPrograms.length, onClick() {
    $commandManager.executeCommand('deleteProgram', { $q, fetchPrograms }, editor.selectedPrograms, Number(machineId))
  } },
  { label: t('menu.copy'), originalLabel: t('menu.copy'), tooltip: t('menu.copy'), shortcut: 'Ctrl+C', icon: 'content_copy', disable: !editor.selectedPrograms.length, onClick() {
    contextMenuStore.copy(editor.selectedPrograms, machineId)
  } },
  { label: t('menu.paste'), originalLabel: t('menu.paste'), tooltip: t('menu.paste'), shortcut: 'Ctrl+V', disable: !contextMenuStore.isThereCopiedValue.value, icon: 'content_paste', onClick() {
    $commandManager.executeCommand('pasteProgram', { $q, fetchPrograms }, Number(machineId))
  } },
  { label: t('menu.refresh'), originalLabel: t('menu.refresh'), tooltip: t('menu.refresh'), shortcut: 'F5', icon: 'refresh', onClick() {
    $commandManager.executeCommand('refresh', { $q, fetchPrograms }, Number(machineId))
  } },
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
    name: 'no',
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
    field:
      (value: { duration: number }) => {
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
          { $q, fetchPrograms },
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
        editor.popupNewProgramVisible = true
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
      shortcut: 'Ctrl+Del',
      icon: 'delete',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand(
          'deleteProgram',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand(
          'deleteProgramFromMultiMachine',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand(
          'concatenatePrograms',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand(
          'changeName',
          { $q, fetchPrograms },
          editor.selectedPrograms,
          machineId,
        )
        // await fetchPrograms()
      },
    },
    {
      label: tt('contextMenu.changeProcessType'),
      shortcut: '',
      icon: '',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand(
          'changeProcessType',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand(
          'sendProgram',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand(
          'copyAndSend',
          { $q, fetchPrograms },
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
        $commandManager.executeCommand('fetchProgram', { fetchPrograms }, editor.selectedPrograms, machineId)
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

function handleFilterClick() {
  $commandManager.executeCommand('filterPrograms', { $q, fetchPrograms, isProgramFilterExists })
}
function handleClearFilterClick() {
  clearFilter()
  isProgramFilterExists.value = false
  fetchPrograms()
}

const filter = ref('')
const debouncedFilter = refDebounced(filter, 250)

const PATH_RE = /^\/machine\/([^/]+?)\/?$/

const fullMatch = computed(() => PATH_RE.test(route.path))
watch(fullMatch, async () => {
  if (fullMatch.value)
    await fetchPrograms()
})
const { results: filterResults } = useFuse(debouncedFilter, programs as Ref<ProgramTable[]>, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['programNo', 'name', 'type'],
  },
})

function formatValue<T extends Record<string, any>>(row: T, column: QTableColumn<T>) {
  const value = typeof column.field === 'function' ? column.field(row) : row[column.field]
  return column.format ? column.format(value, row) : value
}

function formatTooltip<T extends Record<string, any>>(row: T, column: QTableColumn<T> & { tooltip?: (value: any, row: any) => string }) {
  const value = typeof column.field === 'function' ? column.field(row) : row[column.field]
  return column.tooltip ? column.tooltip(value, row) : value
}

const filteredPrograms = computed(() => {
  return filterResults.value.map(r => r.item)
})

function isRowSelected(row: any) {
  return editor.selectedPrograms.includes(row)
}
function removeSelection(row: any) {
  editor.selectedPrograms = editor.selectedPrograms.filter(r => r !== row)
}
async function onRowClick(row: any, isRightClick?: boolean) {
  if (ctrl.value) {
    if (isRowSelected(row)) {
      if (!isRightClick)
        removeSelection(row)
    } else
      editor.selectedPrograms.push(row)
  } else if (!(isRowSelected(row) && isRightClick))
    editor.selectedPrograms = [row]
}

async function onRowDoubleClick(row: any) {
  await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
}
function handleClick(event: { preventDefault: () => void }, option: AppCommand) {
  if (option.disabled)
    event.preventDefault()
  else {
    option.execute()
  }
}

async function handleVersionDelete(deleteVersions: any[]) {
  editor.isLoading = true
  await contextMenuStore.deleteVersion(deleteVersions, machineId)
  await fetchPrograms()
  versions.value = await contextMenuStore.fetchVersions(editor.selectedPrograms[0].programNo, machineId)
  editor.isLoading = false
}
function handleRowColor(row: ProgramHeader) {
  if (0) { // User is not logged in //FIXME:
    return 'grey'
  } else if (row.isChanged)
    return ProgramStateColors.CHANGED_ON_TELESKOP
  else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
    return ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER
  } else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE) {
    return ProgramStateColors.EXISTS_ONLY_ON_DATABASE
  } else {
    const changeDate = (new Date(row.updatedAt || 0)).getTime()
    const changeDateTBB = (new Date(row.updatedAtTBB || 0)).getTime()
    const interval = (changeDateTBB - changeDate) / 1000

    if (interval > 600 || interval < -600) {
      if (row.tbbProgramChangedEvent) {
        // change info came with mm Idk what does it mean
      }
      if (changeDateTBB > changeDate)
        return ProgramStateColors.CHANGED_ON_MACHINE // Program  changed on machine
      else
        return ProgramStateColors.CHANGED_ON_TELESKOP // Program changed on teleskop
    } else {
      return dark.isActive ? ProgramStateColors.NO_CHANGES_DARK : ProgramStateColors.NO_CHANGES
    }
  }
}
</script>

<template>
  <div class="custom-page select-none relative">
    <div v-if="editor.isLoading" class="loading-container ">
      <LoadingSpinner :has-background="false" />
    </div>
    <QTable
      v-if="fullMatch"
      dense
      virtual-scroll
      :rows="filteredPrograms"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[0]"
      flat
      class="no-selected h-80vh"
    >
      <template #top>
        <div class="flex justify-between p-2 w-full">
          <QInput
            v-model="filter"
            dense
            outlined
            debounce="100"
            icon
            autocomplete="false"
            :placeholder="t('search')"
          >
            <template #prepend>
              <QIcon name="search" />
            </template>
          </QInput>
          <QSpace />
          <!-- <QBtn
            icon="add"
            color="grey-8"
            outline
            :label="t('menu.newProgram')"
            @click="router.push(`/machine/${machineId}/program/new`)"
          /> -->
          <QSpace />
          <QBtn
            :icon="isProgramFilterExists ? 'filter_alt_off' : 'filter_alt' "
            color="grey-8"
            flat
            @click="isProgramFilterExists ? handleClearFilterClick() : handleFilterClick()"
          />
        </div>
      </template>
      <template #body="props">
        <QTr
          :props="props"
          :class="[isRowSelected(props.row) ? 'e-selected' : '']"
          :style="{ color: `${handleRowColor(props.row)}` }"
          @click="onRowClick(props.row)"
          @dblclick="onRowDoubleClick(props.row)"
          @contextmenu="onRowClick(props.row, true)"
        >
          <QTd
            v-for="column in columns"
            :key="column.name"
            :props="props"
          >
            <q-menu
              touch-position
              context-menu
              :transition-duration="0"
            >
              <ProgramContextMenu
                :items="contextMenuOptions"
              />
            </q-menu>
            <!-- <q-menu
              touch-position
              context-menu
              :transition-duration="0"
            >
              <q-list
                style="min-width: 300px;"
              >
                <template
                  v-for="option in contextMenuOptions"
                  :key="option.category"
                >
                  <q-separator v-if="addSeparator(option.category)" />
                  <q-item
                    v-close-popup="!option.disabled"
                    clickable
                    dense
                    :disable="option.disabled"
                    @click="event => handleClick(event, option)"
                  >
                    <q-item-section avatar class="menu-icon-class">
                      <q-icon size="1rem" :name="option.icon" />
                    </q-item-section>
                    <q-item-section class="whitespace-nowrap">
                      {{ option.label }}
                    </q-item-section>
                    <q-space />
                    <q-item-section side>
                      {{ option.keybind }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-menu> -->

            <template v-if="column.name === 'operator'">
              <QIcon
                v-if="props.row.operator"
                name="check"
                color="positive"
                size="1rem"
              />
            </template>
            <template v-else>
              {{ formatValue(props.row, column) }}
              <QTooltip
                v-if="column.tooltip"
                class="bg-white text-black e-border text-sm"
                :transition-duration="0"
                :delay="500"
              >
                {{ formatTooltip(props.row, column) }}
              </QTooltip>
            </template>
          </QTd>
        </QTr>
      </template>
    </QTable>
    <!-- <p>{{ t('selectRange', { count: editor.selectedPrograms.length, total: programs.length }) }}</p> -->
    <NuxtPage v-else />
  </div>
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

  <EliarModal v-if="editor.popupNewProgramVisible">
    <CMNewProgramDialog />
  </EliarModal>

  <EliarModal v-if="editor.popupSaveAsProgramVisible">
    <CMSaveAsProgramDialog />
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
