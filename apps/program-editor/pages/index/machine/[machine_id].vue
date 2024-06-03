<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'
import type { QTableColumn } from 'quasar'
import { useFuse } from '@vueuse/integrations/useFuse'
import { EliarModal, LoadingSpinner } from 'ui'
import { useQuasar } from 'quasar'
import { capitalize } from '~/server/utils'
import type { ProgramFilter, ProgramHeader, ProgramTable } from '~/shared/types'
import { PRG_STATE_COLORS, ProgramStatus } from '~/shared/constants'
import type { AppCommand } from '~/composables/new.commands'
import { deleteProgramCommand, pasteProgramCommand } from '~/composables/new.commands'
import { clearFilter, filterToQuery, getExistingFilter } from '~/composables/utils'
import { commandManager, contextMenuStore } from '~/shared/utils'

const { t, locale } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const keycloak = useKeycloak()
const machineId = Number(route.params.machine_id)
const isProgramFilterExists = ref(getExistingFilter())
const programs = ref([] as ProgramHeader[])
async function fetchPrograms(filter?: ProgramFilter) {
  let query
  const checkAnyExistingFilter = getExistingFilter()
  if (checkAnyExistingFilter) {
    query = filterToQuery(checkAnyExistingFilter)
  }
  if (filter) {
    query = filterToQuery(filter)
  }
  programs.value = await $fetch(`/api/machine/${machineId}/program?${query || ''}`)
}

const editor = useEditorStore()
editor.program = editor.createProgram()

contextMenuStore.setCtx({
  t,
})
await fetchPrograms()
const versionDialogVisible = ref(false)
const comparisonDialogVisible = ref(false)
const showSpinner = ref(false)
function wait() {
  showSpinner.value = true
}
function resume() {
  showSpinner.value = false
}
const versions = ref([] as Array<any>)
const isMoreThanOneRowSelected = computed(() => editor.selectedRows.length > 1)

function format(date: any) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const modifiedDate: Date = new Date(date.getTime() - (3 * 60 * 60 * 1000)) // timezone
  return capitalize(formatDistanceToNow(modifiedDate, { addSuffix: true, locale: locale.value === 'tr' ? tr : enGB }))
}

const columns = computed(() => [
  {
    name: 'no',
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
    name: 'step_count',
    label: t('program.stepCount'),
    field: 'stepCount',
    sortable: true,
    align: 'right',
  },
  {
    name: 'type',
    label: t('program.type'),
    field: 'type',
    sortable: true,
    align: 'right',
  },
  {
    name: 'updated_at',
    label: t('program.updated'),
    field: 'updatedAt',
    sortable: true,
    format,
    tooltip: (date: Date) => new Date(date).toLocaleString(locale.value),
  },
])

const contextMenuOptions = computed(() => [
  {
    label: t('contextMenu.copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: false,
    onClick: (data: any) => {
      contextMenuStore.copy(data, machineId)
    },
  },
  {
    label: t('contextMenu.paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !contextMenuStore.isThereCopiedValue(),
    onClick: () => {
      commandManager.executeCommand(
        pasteProgramCommand,
        { $q, fetchPrograms },
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.newProgram'),
    category: 'edit',
    keybind: 'F2',
    icon: 'add',
    disabled: false,
    onClick: () => {},
  },
  {
    label: t('contextMenu.editProgram'),
    category: 'edit',
    keybind: 'F3',
    icon: 'edit',
    disabled: isMoreThanOneRowSelected.value,
    onClick: () => {
      onRowDoubleClick(editor.selectedRows[0])
    },
  },
  {
    label: t('contextMenu.deleteProgram'),
    category: 'edit',
    keybind: 'Ctrl+Del',
    icon: 'delete',
    disabled: false,
    onClick: () => {
      commandManager.executeCommand(
        deleteProgramCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.deleteProgramsFromMachine'),
    category: 'edit',
    icon: '',
    disabled: false,
    onClick: () => {
      commandManager.executeCommand(
        deleteProgramFromMultiMachineCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
      )
    },
  },
  {
    label: t('contextMenu.concatPrograms'),
    category: 'edit',
    keybind: '',
    icon: '',
    disabled: !isMoreThanOneRowSelected.value,
    onClick: () => {
      commandManager.executeCommand(
        concatenateProgramsCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.changeName'),
    category: 'edit',
    keybind: '',
    icon: 'edit_note',
    disabled: isMoreThanOneRowSelected.value || editor.selectedRows.find(row => row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER),
    onClick: () => {
      commandManager.executeCommand(
        changeNameCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.changeProcessType'),
    category: 'edit',
    keybind: '',
    icon: '',
    disabled: false,
    onClick: () => {
      commandManager.executeCommand(
        changeProcessTypeCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.sendProgram'),
    category: 'send',
    keybind: '',
    icon: 'send',
    disabled: false,
    onClick: async () => {
      console.log('contextmenuclick')
      commandManager.executeCommand(
        sendProgramCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.copyToMachinesAndSend'),
    category: 'send',
    keybind: '',
    icon: '',
    disabled: false,
    onClick: () => {
      commandManager.executeCommand(
        copyAndSendCommand,
        { $q, fetchPrograms },
        editor.selectedRows,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.getProgram'),
    category: 'send',
    keybind: '',
    icon: '',
    disabled: false,
    onClick: async () => {
      commandManager.executeCommand(fetchProgramFromMachineCommand, { fetchPrograms }, editor.selectedRows, machineId)
    },
  },
  {
    label: t('contextMenu.addToComparison'),
    category: 'comparison',
    keybind: '',
    icon: 'playlist_add',
    disabled: false,
    onClick: () => {
      contextMenuStore.addToComparisonBasket(editor.selectedRows)
    },
  },
  {
    label: t('contextMenu.compareWith'),
    category: 'comparison',
    keybind: '',
    icon: 'compare_arrows',
    disabled: !contextMenuStore.comparisonBasketLength(),
    onClick: () => {
      contextMenuStore.addToComparisonBasket(editor.selectedRows)
      comparisonDialogVisible.value = true
      contextMenuStore.comparison()
    },
  },
  {
    label: t('contextMenu.programVersion'),
    category: 'version',
    keybind: '',
    icon: 'info',
    disabled: isMoreThanOneRowSelected.value,
    onClick: async () => {
      wait()
      versions.value = await contextMenuStore.fetchVersions(editor.selectedRows[0].programNo, machineId)
      resume()
      versionDialogVisible.value = true
    },
  },
] as AppCommand[])
const ctrl = useKeyModifier('Control')

function handleFilterClick() {
  commandManager.executeCommand(filterProgramsCommand, { $q, fetchPrograms, isProgramFilterExists }, machineId)
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

const { results: filterResults } = useFuse(debouncedFilter, programs as Ref<ProgramTable[]>, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['name', 'type'],
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
  return editor.selectedRows.includes(row)
}
function removeSelection(row: any) {
  editor.selectedRows = editor.selectedRows.filter(r => r !== row)
}
async function onRowClick(row: any, isRightClick?: boolean) {
  if (ctrl.value) {
    if (isRowSelected(row)) {
      if (!isRightClick)
        removeSelection(row)
    } else
      editor.selectedRows.push(row)
  } else if (!(isRowSelected(row) && isRightClick))
    editor.selectedRows = [row]
  // editor.selectedRow = row.programNo
}

async function onRowDoubleClick(row: any) {
  await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
}
function handleClick(event: { preventDefault: () => void }, option: { disabled: any, onClick: (arg0: never[]) => void }) {
  if (option.disabled)
    event.preventDefault()
  else {
    // commandManager.executeCommand(option, editor.selectedRows)
    option.onClick(editor.selectedRows)
  }
}

let lastcategory = contextMenuOptions.value[0].category
function addSeparator(key: string | Function | undefined) {
  if (key !== lastcategory) {
    lastcategory = key
    return true
  } else return false
}

async function handleVersionDelete(deleteVersions: any[]) {
  wait()
  await contextMenuStore.deleteVersion(deleteVersions, machineId)
  await fetchPrograms()
  versions.value = await contextMenuStore.fetchVersions(editor.selectedRows[0].programNo, machineId)
  resume()
}
function handleRowColor(row: ProgramHeader) {
  if (0) { // User is not logged in
    return 'grey'
  } else if (row.isChanged)
    return PRG_STATE_COLORS.CHANGED_ON_TELESKOP
  else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
    return PRG_STATE_COLORS.EXISTS_ONLY_ON_CONTROLLER
  } else if (row.programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE) {
    return PRG_STATE_COLORS.EXISTS_ONLY_ON_DATABASE
  } else {
    const changeDate = (new Date(row.updatedAt || 0)).getTime()
    const changeDateTBB = (new Date(row.updatedAtTBB || 0)).getTime()
    const interval = changeDateTBB - changeDate
    if (interval > 60 || interval < -60) {
      if (row.tbbProgramChangedEvent) {
        // change info came with mm Idk what does it mean
      }
      if (changeDateTBB > changeDate)
        return PRG_STATE_COLORS.CHANGED_ON_MACHINE // Program  changed on machine
      else
        return PRG_STATE_COLORS.CHANGED_ON_TELESKOP // Program changed on teleskop
    } else {
      return dark.isActive ? PRG_STATE_COLORS.NO_CHANGES_DARK : PRG_STATE_COLORS.NO_CHANGES
    }
  }
}
</script>

<template>
  <QPage class="q-pa-md">
    <LoadingSpinner v-if="showSpinner" />
    <!-- :loading="pending" -->
    <QTable
      v-if="fullMatch"
      dense
      :rows="filteredPrograms"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 24 }"
      flat
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
          :class="{ 'e-selected': isRowSelected(props.row) }"
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
            </q-menu>

            {{ formatValue(props.row, column) }}
            <QTooltip
              v-if="column.tooltip"
              class="bg-white text-black e-border text-sm"
              :transition-duration="0"
              :delay="500"
            >
              {{ formatTooltip(props.row, column) }}
            </QTooltip>
          </QTd>
        </QTr>
      </template>
    </QTable>
    <NuxtPage v-else />

    <EliarModal v-if="versionDialogVisible">
      <template #default>
        <CMVersionDialog
          :rows="versions"
          :machine-id="machineId"
          :program-no="editor.selectedRows[0].programNo"
          @update:vis="e => versionDialogVisible = e"
          @on-delete-click="e => handleVersionDelete(e)"
        />
      </template>
    </EliarModal>

    <EliarModal v-if="comparisonDialogVisible">
      <template #default>
        <CMComparisonDialog
          type="comparison"
          @update:vis="e => comparisonDialogVisible = e"
        />
      </template>
    </EliarModal>
  </QPage>
</template>

<style lang="postcss" scoped>
body {
  user-select: none;
}
.menu-icon-class.q-item__section--avatar {
  min-width: auto;
}
</style>
