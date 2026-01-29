<script setup lang="ts">
import { getTransferStatusLabel } from '~/shared/functions'
import type { BatchTransferInfo, BatchTransferInfoDetail } from '~/shared/types'
import { TransferStatus, TransferType } from '~/shared/types'

defineProps<{
  modelValue: boolean
  transfer: BatchTransferInfo | null
  details: BatchTransferInfoDetail[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t, d } = useI18n()

function getTransferTypeLabel(type: TransferType): string {
  if (type === TransferType.Delete) {
    return t('transferredJobOrders.transferType.deleted')
  }
  return t('transferredJobOrders.transferType.append')
}

function getTransferTypeColor(type: TransferType): string {
  return type === TransferType.Delete ? 'negative' : 'positive'
}

function getTransferStatusColor(status: TransferStatus): string {
  return status === TransferStatus.Failed ? 'negative' : 'positive'
}
</script>

<template>
  <q-dialog
    persistent
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="bg-black text-white">
        <div class="text-h6">
          {{ t('transferredJobOrders.detailDialog.title') }}
        </div>
      </q-card-section>

      <q-card-section v-if="transfer">
        <div class="q-gutter-md">
          <div class="row">
            <div class="col-6">
              <strong>{{ t('transferredJobOrders.operationType') }}:</strong>
              <q-chip
                :color="getTransferTypeColor(transfer.transferType)"
                text-color="white"
                dense
              >
                {{ getTransferTypeLabel(transfer.transferType) }}
              </q-chip>
            </div>
            <div class="col-6">
              <strong>{{ t('transferredJobOrders.date') }}:</strong>
              {{ d(transfer.transferDate, 'datetime') }}
            </div>
          </div>
          <div class="row">
            <div class="col-6">
              <strong>{{ t('joborder') }}:</strong>
              {{ transfer.jobOrder }}
            </div>
            <div class="col-6">
              <strong>{{ t('transferredJobOrders.correction') }}:</strong>
              {{ transfer.correctionNo || '-' }}
            </div>
          </div>
          <div class="row">
            <div class="col-6">
              <strong>{{ t('transferredJobOrders.machine') }}:</strong>
              {{ transfer.machineCode }}
            </div>
            <div class="col-6">
              <strong>{{ t('status') }}:</strong>
              <q-chip
                :color="getTransferStatusColor(transfer.transferStatus)"
                text-color="white"
                dense
              >
                {{ getTransferStatusLabel(transfer.transferStatus) }}
              </q-chip>
            </div>
          </div>

          <q-separator />

          <div>
            <strong>{{ t('transferredJobOrders.detailDialog.descriptions') }}:</strong>
            <q-list
              v-if="details.length > 0"
              bordered
              separator
            >
              <q-item
                v-for="(detail, index) in details"
                :key="index"
                dense
              >
                <q-item-section>
                  {{ detail.explanation }}
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-grey-6 q-mt-sm">
              {{ t('noPreviousStepLogs') }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          flat
          :label="t('close')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="postcss">
</style>
