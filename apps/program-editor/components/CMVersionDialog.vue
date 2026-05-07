<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { ProgramHeaderArchive } from '~/shared/types'
import { contextMenuStore } from '~/utils/context-menu'

const props = defineProps<{
  machine: {
    id: number
    name: string
  }
  program: {
    programNo: number
    name: string
  }
  rows: ProgramHeaderArchive[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t, locale } = useI18n()
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const { notifySuccess, notifyError } = useNotify()

const deleteVersionDialogVis = ref(false)
const selectedRows = ref<ProgramHeaderArchive[]>([])
const versions = ref<ProgramHeaderArchive[]>(props.rows)
const isLoading = ref(false)

const isOperatorEditable = ref(false)

const isActiveSelected = computed(() => {
  const lastVersion = versions.value.at(-1)?.version
  return selectedRows.value.some(v => v.version === lastVersion)
})

const columns: QTableColumn<ProgramHeaderArchive>[] = [
  { name: 'version', label: t('versionDialog.version'), field: 'version', align: 'left' },
  { name: 'name', label: t('versionDialog.programName'), field: 'name', align: 'left' },
  { name: 'stepCount', label: t('versionDialog.stepCount'), field: 'stepCount', align: 'center' },
  { name: 'updatedAt', label: t('versionDialog.updatedAt'), field: 'updatedAt', align: 'right', format: val => new Date(val).toLocaleString(locale.value) },
]

async function handleDelete() {
  deleteVersionDialogVis.value = false
  isLoading.value = true
  const versionNos = selectedRows.value.map(v => v.version)

  try {
    const deletedVersions = await contextMenuStore.deleteVersions(props.machine.id, props.program.programNo, versionNos)
    await contextMenuStore.fetchVersions(props.machine.id, props.program.programNo)
    notifySuccess(t('contextMenu.version.deleteSuccess', { versions: deletedVersions.sort() }))
  } catch (error) {
    console.error('Error deleting versions:', error)
    notifyError(t('contextMenu.version.deleteFail'))
  } finally {
    versions.value = contextMenuStore.programVersions.value
    selectedRows.value = []
    isLoading.value = false
  }
}

async function setActiveVersion() {
  isLoading.value = true
  const version = selectedRows.value[0]?.version

  try {
    await contextMenuStore.setActiveVersion(props.machine.id, props.program.programNo, version, isOperatorEditable.value)
    await contextMenuStore.fetchVersions(props.machine.id, props.program.programNo)

    notifySuccess(t('contextMenu.version.setActiveSuccess', { version }))
    onDialogOK()
  } catch (error) {
    console.error('Error setting active version:', error)
    notifyError(t('contextMenu.version.setActiveFail', { version: selectedRows.value[0]?.version }))
  } finally {
    versions.value = contextMenuStore.programVersions.value
    selectedRows.value = []
    isLoading.value = false
  }
}

function onRowClick(event: Event, row: ProgramHeaderArchive) {
  selectedRows.value = [row]
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-200 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('versionDialog.title') }}
          <q-space />
          <q-btn
            v-close-popup
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
          />
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ props.machine.id }} - {{ props.machine.name }}
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ props.program.programNo }} - {{ props.program.name }}
        </div>
      </q-card-section>

      <q-card-section>
        <div class="flex gap-2 mb-3">
          <q-btn
            :label="t('versionDialog.compare')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            :disable="selectedRows.length !== 2"
            @click="navigateTo({
              path: '/comparison',
              query: { m: props.machine.id, p1: props.program.programNo, p2: props.program.programNo, v1: selectedRows[0]?.version, v2: selectedRows[1]?.version },
            })"
          >
            <q-tooltip v-if="selectedRows.length !== 2">
              {{ t('versionDialog.selectTwoVersionsToCompare') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            :label="t('versionDialog.makeDefault')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            :disable="isActiveSelected || selectedRows.length !== 1"
            @click="setActiveVersion()"
          >
            <q-tooltip v-if="isActiveSelected">
              {{ t('versionDialog.alreadyActiveVersion') }}
            </q-tooltip>
          </q-btn>

          <q-btn
            :label="t('delete')"
            class="bg-negative text-white"
            flat
            :disable="isActiveSelected || !selectedRows.length"
            @click="deleteVersionDialogVis = true"
          >
            <q-tooltip v-if="isActiveSelected">
              {{ t('versionDialog.cannotDeleteActiveVersion') }}
            </q-tooltip>
          </q-btn>
        </div>
        <q-table
          v-model:selected="selectedRows"
          class="h-70"
          :columns="columns"
          :rows="versions"
          row-key="version"
          selection="multiple"
          hide-bottom
          bordered
          flat
          dense
          :rows-per-page-options="[0]"
          table-header-style="position: sticky; top: 0; z-index: 1; height: 40px;"
          table-header-class="bg-gray-1 dark:bg-dark-4"
          @row-click="onRowClick"
        >
          <template #body-cell="{ value, row, col }">
            <q-td
              :props="{ value, row, col }"
              :class="row.version === versions[versions.length - 1].version ? 'text-green-8' : ''"
            >
              {{ value }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-section class="pt-0">
        <q-checkbox
          v-model="isOperatorEditable"
          :label="t('versionDialog.operatorEditable')"
          dense
          class="pl-2"
        />
      </q-card-section>

      <q-dialog v-model="deleteVersionDialogVis">
        <q-card>
          <q-card-section>
            <div class="text-h6 flex">
              {{ t('contextMenu.deleteVersionDialog.title') }}
              <q-space />
              <q-btn
                v-close-popup
                class="text-gray-4 dark:text-gray-6"
                icon="close"
                flat
                round
                dense
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div>
              {{ t('contextMenu.deleteVersionDialog.warning', { code: selectedRows.map(e => e.version).sort() }) }}
            </div>
          </q-card-section>

          <q-card-actions
            align="right"
            class="q-pa-md bg-gray-1 dark:bg-dark-4"
          >
            <q-btn
              v-close-popup
              class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
              :label="t('cancel')"
              flat
            />
            <q-btn
              :label="t('delete')"
              class="q-mr-sm bg-red text-white"
              flat
              @click="handleDelete"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          v-close-popup
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
