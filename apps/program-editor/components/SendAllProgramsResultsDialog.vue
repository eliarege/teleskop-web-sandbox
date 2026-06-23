<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { SendAllProgramResult } from '~/shared/types'

const props = defineProps<{
  machine: {
    id: number
    name: string
  }
  results: SendAllProgramResult[]
  summary: {
    count: number
    total: number
    skipped: number
  }
}>()

const { t, te } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const failedCount = computed(() => props.results.filter(r => r.status === 'failed').length)

function getErrorMessage(row: SendAllProgramResult): string {
  if (row.errorCode && row.errorDetail) {
    const key = `sendAllProgramsResultsDialog.errors.${row.errorCode}`
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
    label: t('sendAllProgramsResultsDialog.programName'),
    field: 'programName',
    align: 'left',
  },
  {
    name: 'status',
    label: t('sendAllProgramsResultsDialog.status'),
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
          {{ t('sendAllProgramsResultsDialog.title') }}
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
          {{ t('sendAllProgramsResultsDialog.summary', { count: props.summary.count, total: props.summary.total, skipped: props.summary.skipped, failed: failedCount }) }}
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
                <!-- Sent -->
                <q-icon
                  v-if="cellProps.row.status === 'sent'"
                  name="check"
                  color="positive"
                  size="sm"
                >
                  <q-tooltip>
                    {{ t('sendAllProgramsResultsDialog.sent') }}
                  </q-tooltip>
                </q-icon>

                <!-- Skipped -->
                <q-icon
                  v-else-if="cellProps.row.status === 'skipped'"
                  name="remove_circle_outline"
                  color="grey-6"
                  size="sm"
                >
                  <q-tooltip>
                    {{ t('sendAllProgramsResultsDialog.skippedTooltip') }}
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
