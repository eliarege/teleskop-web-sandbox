<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enGB, tr } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'
import type { QTableColumn } from 'quasar'
import { useFuse } from '@vueuse/integrations/useFuse'
import { EliarModal, LoadingSpinner } from 'ui'
import { useQuasar } from 'quasar'
import { capitalize } from '~/server/utils'
import type { ProgramFilter, ProgramHeader } from '~/shared/types'
import { PRG_STATE_COLORS, ProgramStatus } from '~/shared/constants'
import type { AppCommand } from '~/composables/new.commands'
import { deleteProgramCommand, pasteProgramCommand } from '~/composables/new.commands'
import { filterToQuery, getExistingFilter } from '~/composables/utils'
import { commandManager, contextMenuStore } from '~/shared/utils'

const { t } = useI18n()
const { locale } = useI18n()
const editor = useEditorStore()

const $q = useQuasar()
const route = useRoute()
const keycloak = useKeycloak()
const machineId = Number(route.params.machine_id)

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

contextMenuStore.setCtx({
  t,
})
await fetchPrograms()
const selectedRows = ref([])
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
const isMoreThanOneRowSelected = computed(() => selectedRows.value.length > 1)

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
      onRowDoubleClick(selectedRows.value[0])
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
        selectedRows.value,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.deleteProgramsFromMachine'),
    category: 'edit',
    keybind: '',
    icon: '',
    disabled: false,
    onClick: () => {
      commandManager.executeCommand(
        deleteProgramFromMultiMachineCommand,
        { $q, fetchPrograms },
        selectedRows.value,
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
        selectedRows.value,
        machineId,
      )
    },
  },
  {
    label: t('contextMenu.changeName'),
    category: 'edit',
    keybind: '',
    icon: 'edit_note',
    disabled: isMoreThanOneRowSelected.value || selectedRows.value.find(row => row.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER),
    onClick: () => {
      commandManager.executeCommand(
        changeNameCommand,
        { $q, fetchPrograms },
        selectedRows.value,
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
        selectedRows.value,
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
        selectedRows.value,
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
        selectedRows.value,
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
      commandManager.executeCommand(fetchProgramFromMachineCommand, { fetchPrograms }, selectedRows.value, machineId)
    },
  },
  {
    label: t('contextMenu.addToComparison'),
    category: 'comparison',
    keybind: '',
    icon: 'playlist_add',
    disabled: false,
    onClick: () => {
      contextMenuStore.addToComparisonBasket(selectedRows.value)
    },
  },
  {
    label: t('contextMenu.compareWith'),
    category: 'comparison',
    keybind: '',
    icon: 'compare_arrows',
    disabled: !contextMenuStore.comparisonBasketLength(),
    onClick: () => {
      contextMenuStore.addToComparisonBasket(selectedRows.value)
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
      versions.value = await contextMenuStore.fetchVersions(selectedRows.value[0].programNo, machineId)
      resume()
      versionDialogVisible.value = true
    },
  },
] as AppCommand[])
const ctrl = useKeyModifier('Control')

function handleFilterClick() {
  commandManager.executeCommand(filterProgramsCommand, { $q, fetchPrograms }, machineId)
}

const filter = ref('')
const debouncedFilter = refDebounced(filter, 250)

const PATH_RE = /^\/machine\/([^/]+?)\/?$/

const fullMatch = computed(() => PATH_RE.test(route.path))

const { results: filterResults } = useFuse(debouncedFilter, programs as Ref<any[]>, {
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
  return selectedRows.value.includes(row)
}
function removeSelection(row: any) {
  selectedRows.value = selectedRows.value.filter(r => r !== row)
}
async function onRowClick(row: any, isRightClick?: boolean) {
  if (ctrl.value) {
    if (isRowSelected(row)) {
      if (!isRightClick)
        removeSelection(row)
    } else
      selectedRows.value.push(row)
  } else if (!(isRowSelected(row) && isRightClick))
    selectedRows.value = [row]
}

async function onRowDoubleClick(row: any) {
  await navigateTo(`/machine/${machineId}/program/${row.programNo}`)
}
function handleClick(event: { preventDefault: () => void }, option: { disabled: any, onClick: (arg0: never[]) => void }) {
  if (option.disabled)
    event.preventDefault()
  else {
    // commandManager.executeCommand(option, selectedRows.value)
    option.onClick(selectedRows.value)
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
  versions.value = await contextMenuStore.fetchVersions(selectedRows.value[0].programNo, machineId)
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
      return PRG_STATE_COLORS.NO_CHANGES
    }
  }
}

const router = useRouter()
</script>

<template>
  <QPage class="m-4">
    <LoadingSpinner v-if="showSpinner" />
    <!-- :loading="pending" -->
    <QTable
      v-if="fullMatch"
      dense
      :rows="programs"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 24 }"
    >
      <template #top>
        <div class="flex justify-between p-2 w-full">
          <QInput
            v-model="filter"
            class="inline"
            dense
            outlined
            debounce="100"
            icon
            :placeholder="t('search')"
          >
            <template #prepend>
              <QIcon name="search" />
            </template>
          </QInput>
          <QSpace />
          <QBtn
            icon="add"
            color="black"
            label="New Program"
            outline
            @click="router.push(`/machine/${machineId}/program/new`)"
          />
          <QSpace />
          <QBtn
            icon="filter_alt"
            color="black"
            outline
            @click="handleFilterClick"
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
            :class="{ 'e-selected': isRowSelected(props.row) }"
            :style="{ color: `${handleRowColor(props.row)}` }"
            @click="onRowClick(props.row)"
            @dblclick="onRowDoubleClick(props.row)"
            @contextmenu="onRowClick(props.row, true)"
          >
            <q-menu
              v-if="keycloak.authenticated"
              touch-position
              context-menu
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
                    :class="option.disabled ? 'text-gray cursor-not-allowed' : ''"
                    @click="event => handleClick(event, option)"
                  >
                    <q-item-section class="flex w-8 justify-center items-center">
                      <q-icon :name="option.icon" />
                    </q-item-section>
                    <q-item-section>
                      {{ option.label }}
                    </q-item-section>
                    <q-space />
                    <q-item-section class="mr-5">
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
          :program-no="selectedRows[0].programNo"
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

<style lang="postcss">
.q-item__label {
  padding-left: .5rem;
}
.q-item--dense {
  padding: 2px 0px !important;
}
.q-item__section--main {
  flex: none;
}
.q-item__section--main + .q-item__section--main {
  margin-left: 0px;
}
body {
  user-select: none;
}
</style>
