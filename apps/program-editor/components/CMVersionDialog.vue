<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { ProgramHeaderArchive } from '~/shared/types'
import { contextMenuStore } from '~/utils/context-menu'

const props = defineProps<{
  machineId: number
  machineName: string
  programNo: number
  programName: string
  rows: ProgramHeaderArchive[]
}>()

const { t, locale } = useI18n()
const editor = useEditorStore()
const { dialogRef } = useDialogPluginComponent()
const { notifySuccess, notifyError } = useNotify()

const deleteVersionDialogVis = ref(false)
const selectedRows = ref<ProgramHeaderArchive[]>([])
const versions = ref<ProgramHeaderArchive[]>(props.rows)
const isLoading = ref(false)

const isActiveSelected = computed(() => {
  const lastVersion = versions.value.at(-1)?.version
  return selectedRows.value.some(v => v.version === lastVersion)
})

const columns: QTableColumn<ProgramHeaderArchive>[] = [
  { name: 'version', label: t('versionDialog.version'), field: 'version', align: 'left' },
  { name: 'name', label: t('versionDialog.programName'), field: 'name', align: 'left' },
  { name: 'stepCount', label: t('versionDialog.stepCount'), field: 'stepCount', align: 'center' },
  { name: 'updatedAt', label: t('versionDialog.updatedAt'), field: 'updatedAt', align: 'right', format: val =>
    val
      ? new Date(val).toLocaleString(locale.value, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
      : '-' },
]

async function handleDelete() {
  deleteVersionDialogVis.value = false
  isLoading.value = true

  try {
    const versionNos = selectedRows.value.map(v => v.version)
    const deletedVersions = await contextMenuStore.deleteVersion(props.machineId, props.programNo, versionNos)
    versions.value = await contextMenuStore.fetchVersions(props.machineId, props.programNo)
    notifySuccess(t('contextMenu.version.deleteSuccess', { versions: deletedVersions.sort() }))
  } catch (error) {
    console.error('Error deleting versions:', error)
    notifyError(t('contextMenu.version.deleteFail'))
  } finally {
    isLoading.value = false
  }
}

async function setActiveVersion() {
  isLoading.value = true

  try {
    const version = selectedRows.value[0]?.version
    await contextMenuStore.setActiveVersion(props.machineId, props.programNo, version)
    versions.value = await contextMenuStore.fetchVersions(props.machineId, props.programNo)
    await editor.fetchProgram(props.machineId, props.programNo)
    notifySuccess(t('contextMenu.version.setActiveSuccess', { version }))
  } catch (error) {
    console.error('Error setting active version:', error)
    notifyError(t('contextMenu.version.setActiveFail', { version: selectedRows.value[0]?.version }))
  } finally {
    isLoading.value = false
  }
}

function onRowClick(event: Event, row: ProgramHeaderArchive) {
  selectedRows.value = [row]
}
</script>

<template>
  <q-dialog ref="dialogRef">
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
          {{ props.machineId }} - {{ props.machineName }}
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ props.programNo }} - {{ props.programName }}
        </div>
      </q-card-section>

      <q-card-section>
        <div class="flex gap-2 mb-3">
          <q-btn
            :label="t('versionDialog.compare')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            :disable="selectedRows.length !== 2"
            @click="navigateTo(`/comparison?m=${machineId}&p1=${programNo}&p2=${programNo}&v1=${selectedRows[0].version}&v2=${selectedRows[1].version}`)"
          />
          <q-btn
            :label="t('versionDialog.makeDefault')"
            class="bg-gray-2 text-dark-4 dark:bg-dark-3 dark:text-gray-4"
            flat
            :disable="isActiveSelected || selectedRows.length > 1"
            @click="setActiveVersion()"
          />
          <q-btn
            :label="t('delete')"
            class="bg-negative text-white"
            flat
            :disable="isActiveSelected || !selectedRows.length"
            @click="deleteVersionDialogVis = true"
          />
        </div>
        <q-table
          v-model:selected="selectedRows"
          class="h-100"
          :columns="columns"
          :rows="versions"
          row-key="version"
          selection="multiple"
          hide-bottom
          bordered
          flat
          dense
          :rows-per-page-options="[0]"
          @row-click="onRowClick"
        />
      </q-card-section>

      <q-dialog v-model="deleteVersionDialogVis">
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar
              icon="delete"
            />
            <span class="q-ml-sm"> {{ t('contextMenu.deleteVersionDialog.warning', { code: selectedRows.map(e => e.version).sort() }) }}</span>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              v-close-popup
              :label="t('cancel')"
              outline
              color="black"
              icon="close"
            />
            <q-btn
              v-close-popup
              outline
              :label="t('delete')"
              color="red"
              icon="delete"
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
