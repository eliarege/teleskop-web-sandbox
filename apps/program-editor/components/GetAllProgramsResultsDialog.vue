<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { GetAllProgramResult } from '~/shared/types'

const props = defineProps<{
  machine: {
    id: number
    name: string
  }
  results: GetAllProgramResult[]
  summary: {
    count: number
    total: number
  }
}>()

const { t, te } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const failedCount = computed(() => props.results.filter(r => r.status === 'failed').length)

function getErrorMessage(row: GetAllProgramResult): string {
  if (row.errorCode && row.errorDetail) {
    const key = `getAllProgramsResultsDialog.errors.${row.errorCode}`
    if (te(key)) {
      return t(key, row.errorDetail as Record<string, unknown>)
    }
  }
  return row.error ?? ''
}

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'programNo',
    label: '#',
    field: 'programNo',
    align: 'left',
  },
  {
    name: 'programName',
    label: t('getAllProgramsResultsDialog.programName'),
    field: 'programName',
    align: 'left',
  },
  {
    name: 'status',
    label: t('getAllProgramsResultsDialog.status'),
    field: 'status',
    align: 'center',
  },
])
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card class="select-none" style="min-width: 600px">
      <!-- Header -->
      <q-card-section>
        <div class="text-h6 flex items-center">
          {{ t('getAllProgramsResultsDialog.title') }}
          <QSpace />
          <QBtn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8 color-gray-6 dark:text-gray-4">
          {{ props.machine.id }} - {{ props.machine.name }}
        </div>
      </q-card-section>

      <!-- Summary -->
      <q-card-section class="pt-0">
        <div class="text-subtitle2 text-grey-8 dark:text-grey-3">
          {{ t('getAllProgramsResultsDialog.summary', { count: props.summary.count, total: props.summary.total, failed: failedCount }) }}
        </div>
      </q-card-section>

      <!-- Results Table -->
      <q-card-section class="pt-0">
        <q-table
          :rows="props.results"
          :columns="columns"
          dense
          flat
          :rows-per-page-options="[0]"
          :pagination="{ sortBy: 'programNo', descending: false, rowsPerPage: 0 }"
          table-header-style="position: sticky; top: 0; z-index: 1; height: 40px;"
          table-header-class="bg-gray-1 dark:bg-dark-4"
          style="max-height: 400px"
        >
          <!-- Program Name Column -->
          <template #body-cell-programName="cellProps">
            <q-td :props="cellProps">
              <TruncatedText
                :text="cellProps.value"
                :max-length="50"
              />
            </q-td>
          </template>

          <!-- Status Column -->
          <template #body-cell-status="cellProps">
            <q-td :props="cellProps" class="text-center">
              <div class="flex items-center justify-center">
                <!-- Received -->
                <q-icon
                  v-if="cellProps.row.status === 'received'"
                  name="check"
                  color="positive"
                  size="sm"
                >
                  <q-tooltip>
                    {{ t('getAllProgramsResultsDialog.received') }}
                  </q-tooltip>
                </q-icon>

                <!-- Failed -->
                <q-icon
                  v-else
                  name="close"
                  color="negative"
                  size="sm"
                >
                  <q-tooltip v-if="cellProps.row.error">
                    {{ getErrorMessage(cellProps.row) }}
                  </q-tooltip>
                </q-icon>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Footer -->
      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
