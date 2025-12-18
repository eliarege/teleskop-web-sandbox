<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { CopyAndSendResult } from '~/server/utils/JobManager'

const props = defineProps<{
  machine: { id: number, name: string }
  results: CopyAndSendResult[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'machine',
    label: t('contextMenu.copyAndSend.dialog.machine'),
    field: 'machineName',
    align: 'left',

  },
  {
    name: 'program',
    label: t('contextMenu.copyAndSend.dialog.program'),
    field: 'programName',
    align: 'left',
  },
  {
    name: 'copyToMachine',
    label: t('contextMenu.copyAndSend.dialog.copyToMachine'),
    field: 'copyToMachine',
    align: 'center',
  },
  {
    name: 'sentToDevice',
    label: t('contextMenu.copyAndSend.dialog.sentToDevice'),
    field: 'sentToDevice',
    align: 'center',
  },
])
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="select-none">
      <!-- Header -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t('contextMenu.copyAndSend.dialog.title') }}
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
      </QCardSection>

      <!-- Results Table -->
      <QCardSection>
        <QTable
          :rows="props.results"
          :columns="columns"
          dense
          flat
          :rows-per-page-options="[0]"
          style="max-height: 400px"
        >
          <!-- Machine Column -->
          <template #body-cell-machine="cellProps">
            <QTd :props="cellProps">
              <div>
                <div class="text-weight-medium">
                  <TruncatedText :text="cellProps.value" />
                </div>
              </div>
            </QTd>
          </template>

          <!-- Program Column -->
          <template #body-cell-program="cellProps">
            <QTd :props="cellProps">
              <div>
                <div class="text-weight-medium">
                  {{ cellProps.row.programNo }} - <TruncatedText :text="cellProps.value" />
                </div>
              </div>
            </QTd>
          </template>

          <!-- Sent to Machine Column -->
          <template #body-cell-copyToMachine="cellProps">
            <QTd :props="cellProps" class="text-center">
              <div class="flex items-center justify-center">
                <QIcon
                  :name="cellProps.value ? 'check' : (cellProps.row.copySkipped ? 'warning' : 'close')"
                  :color="cellProps.value ? 'positive' : (cellProps.row.copySkipped ? 'warning' : 'negative')"
                  size="sm"
                >
                  <QTooltip v-if="!cellProps.value && (cellProps.row.copyError || cellProps.row.copySkipped)">
                    {{ cellProps.row.copyError || (cellProps.row.copySkipped ? 'Copy skipped' : '') }}
                  </QTooltip>
                </QIcon>
              </div>
            </QTd>
          </template>

          <!-- Sent to Device Column -->
          <template #body-cell-sentToDevice="cellProps">
            <QTd :props="cellProps" class="text-center">
              <div class="flex items-center justify-center">
                <QIcon
                  :name="cellProps.value ? 'check' : 'close'"
                  :color="cellProps.value ? 'positive' : 'negative'"
                  size="sm"
                >
                  <QTooltip v-if="!cellProps.value && (cellProps.row.sendError || cellProps.row.error)">
                    {{ cellProps.row.sendError || cellProps.row.error }}
                  </QTooltip>
                </QIcon>
              </div>
            </QTd>
          </template>
        </QTable>
      </QCardSection>

      <!-- Footer -->
      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
      </QCardActions>
    </q-card>
  </q-dialog>
</template>
