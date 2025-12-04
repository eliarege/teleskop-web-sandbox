<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { BulkDeletionResponse } from '~/shared/types'

const props = defineProps<{
  machine: {
    id: number
    name: string
  }
  results: BulkDeletionResponse
}>()

const { t } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'program',
    label: t('deleteResultsDialog.program'),
    field: 'programName',
    align: 'left',
  },
  {
    name: 'deletedFromMachine',
    label: t('deleteResultsDialog.deletedFromMachine'),
    field: 'deletedFromMachine',
    align: 'center',
  },
  {
    name: 'deletedFromDb',
    label: t('deleteResultsDialog.deletedFromDb'),
    field: 'deletedFromDb',
    align: 'center',
  },
])
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card class="select-none">
      <!-- Header -->
      <q-card-section>
        <div class="text-h6 flex items-center">
          {{ t('deleteResultsDialog.title') }}
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

      <!-- Results Table -->
      <q-card-section>
        <q-table
          :rows="props.results.results"
          :columns="columns"
          dense
          flat
          :rows-per-page-options="[0]"
          style="max-height: 400px"
        >
          <!-- Program Column -->
          <template #body-cell-program="cellProps">
            <q-td :props="cellProps">
              <div>
                <div class="text-weight-medium">
                  {{ cellProps.row.programNo }} - <TruncatedText :text="cellProps.value" />
                </div>
              </div>
            </q-td>
          </template>

          <!-- Deleted From Machine Column -->
          <template #body-cell-deletedFromMachine="cellProps">
            <q-td :props="cellProps" class="text-center">
              <div class="flex items-center justify-center">
                <q-icon
                  :name="cellProps.value ? 'check' : 'close'"
                  :color="cellProps.value ? 'positive' : 'negative'"
                  size="sm"
                >
                  <q-tooltip v-if="!cellProps.value && (cellProps.row.error || cellProps.row.deletedFromMachine)">
                    {{ cellProps.row.error || (cellProps.row.deletedFromMachine ? 'Deleted from machine' : '') }}
                  </q-tooltip>
                </q-icon>
              </div>
            </q-td>
          </template>

          <!-- Deleted From Db Column -->
          <template #body-cell-deletedFromDb="cellProps">
            <q-td :props="cellProps" class="text-center">
              <div class="flex items-center justify-center">
                <q-icon
                  :name="cellProps.value ? 'check' : 'close'"
                  :color="cellProps.value ? 'positive' : 'negative'"
                  size="sm"
                >
                  <q-tooltip v-if="!cellProps.value && (cellProps.row.error || cellProps.row.deletedFromDb)">
                    {{ cellProps.row.error || (cellProps.row.deletedFromDb ? 'Deleted from database' : '') }}
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
