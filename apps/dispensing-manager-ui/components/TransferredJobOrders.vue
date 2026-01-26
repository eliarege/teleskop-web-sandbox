<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { QTableProps } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import { type BatchTransferInfo, type BatchTransferInfoDetail, TransferStatus, TransferType } from '~/shared/types'
import { getTransferStatusLabel } from '~/shared/functions'

const { t, d } = useI18n()
const keycloak = useKeycloak()

const externalFilterSlots = useStorage('transferFilterSlots', [], sessionStorage)
const { data: machines } = await useAuthFetch('/api/machine/machines')
const rowsNumber = await keycloak.fetch('/api/transfer/transfer-count')
const pagination = ref({ rowsPerPage: 25, page: 1, rowsNumber } as QTableProps['pagination'])
const visibleLoading = ref(true)
const transfers = ref<BatchTransferInfo[]>([])
const showDetailDialog = ref(false)
const selectedTransfer = ref<BatchTransferInfo | null>(null)
const transferDetails = ref<BatchTransferInfoDetail[]>([])

async function fetchData() {
  visibleLoading.value = true
  const response = await keycloak.fetch('/api/transfer/transfers', {
    method: 'POST',
    body: { pagination: pagination.value, filters: externalFilterSlots.value },
  }).finally(() => visibleLoading.value = false)
  transfers.value = response.rows
  pagination.value!.rowsNumber = response.count
}

watch(pagination, async () => {
  visibleLoading.value = true
  await fetchData()
  visibleLoading.value = false
})
const columns = computed(() => [
  {
    name: 'transferType',
    label: t('transferredJobOrders.operationType'),
    field: 'transferType',
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('transferredJobOrders.transferType.append'), transferType: TransferType.Append },
      { label: t('transferredJobOrders.transferType.update'), transferType: TransferType.Update },
      { label: t('transferredJobOrders.transferType.deleted'), transferType: TransferType.Delete },
    ],
    optionLabel: 'label',
    optionValue: 'transferType',
    format: (val: TransferType) => getTransferTypeLabel(val),
    align: 'center',
  },
  {
    name: 'transferDate',
    label: t('transferredJobOrders.date'),
    field: 'transferDate',
    filterable: true,
    filterType: 'date',
    format: (val: Date) => d(val, 'datetime'),
    align: 'center',
  },
  {
    name: 'joborder',
    label: t('joborder'),
    field: 'joborder',
    filterable: true,
    filterType: 'comparison',
    align: 'center',
  },
  {
    name: 'machineid',
    label: t('transferredJobOrders.machine'),
    field: 'machinecode',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines.value,
    optionLabel: 'machinecode',
    optionValue: 'machineid',
    align: 'center',
  },
  {
    name: 'correctionNo',
    label: t('transferredJobOrders.correction'),
    field: 'correctionNo',
    filterable: true,
    filterType: 'comparison',
    format: (val: number) => val === 0 ? '' : val,
    align: 'center',
  },
  {
    name: 'transferStatus',
    label: t('status'),
    field: 'transferStatus',
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      { label: t('transferredJobOrders.transferStatus.success'), transferStatus: TransferStatus.Success },
      { label: t('transferredJobOrders.transferStatus.successWithoutRecipe'), transferStatus: TransferStatus.SuccessWithoutRecipe },
      { label: t('transferredJobOrders.transferStatus.failed'), transferStatus: TransferStatus.Failed },
    ],
    optionLabel: 'label',
    optionValue: 'transferStatus',
    format: (val: TransferStatus) => getTransferStatusLabel(val),
    align: 'center',
  },
] as FilterableTableColumn[])

function getTransferTypeLabel(type: TransferType): string {
  if (type === TransferType.Delete) {
    return t('transferredJobOrders.transferType.deleted')
  }
  if (type === TransferType.Append) {
    return t('transferredJobOrders.transferType.append')
  }
  return t('transferredJobOrders.transferType.update')
}

function getTransferTypeColor(type: TransferType): string {
  if (type === TransferType.Delete) {
    return 'negative'
  }
  if (type === TransferType.Update) {
    return 'warning'
  } else return 'positive'
}

function getTransferStatusColor(status: TransferStatus): string {
  if (status === TransferStatus.Failed) {
    return 'negative'
  }
  if (status === TransferStatus.SuccessWithoutRecipe) {
    return 'warning'
  } else return 'positive'
}

async function handleRowDblClick(row: BatchTransferInfo) {
  await showDetails(row)
}

async function showDetails(transfer: BatchTransferInfo) {
  selectedTransfer.value = transfer
  const details = await keycloak.fetch(`/api/transfer/transfer-details/${transfer.id}`)
  transferDetails.value = details
  showDetailDialog.value = true
}

async function handleFilterSlotsUpdate(updatedValue: any) {
  externalFilterSlots.value = updatedValue
  await fetchData()
}
</script>

<template>
  <div class="outer-div">
    <div class="gap-5">
      <div v-if="visibleLoading" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2 z-10">
        <LoadingSpinner />
      </div>
      <span class="flex items-center ml-5 mt-4 text-size-4">
        {{ t('warnings.doubleClickToShowRecipe') }}
      </span>
      <div class="responsive-flex-container">
        <FilterableTable
          v-model:pagination="pagination"
          class="responsive-table"
          disable-search-filter
          :rows="transfers"
          :columns="columns"
          dense
          :filter-slots="externalFilterSlots"
          @row-dblclick="row => handleRowDblClick(row)"
          @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
          @update-pagination="pgn => pagination = pgn"
        >
          <template #custombody="props">
            <q-tr
              :props="props"
              style="cursor: pointer;"
              @dblclick="handleRowDblClick(props.row)"
            >
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :class="col.name === 'transferType' || col.name === 'transferStatus' ? 'text-white' : ''"
                :style="col.name === 'transferType'
                  ? `background-color: var(--q-${getTransferTypeColor(props.row.transferType)})`
                  : col.name === 'transferStatus'
                    ? `background-color: var(--q-${getTransferStatusColor(props.row.transferStatus)})`
                    : ''"
              >
                {{ col.value }}
              </q-td>
              <q-td :props="props" auto-width>
                <q-btn
                  flat
                  dense
                  round
                  icon="info"
                  @click.stop="showDetails(props.row)"
                >
                  <q-tooltip>{{ t('transferredJobOrders.detail') }}</q-tooltip>
                </q-btn>
              </q-td>
            </q-tr>
          </template>
        </FilterableTable>
      </div>
    </div>

    <TransferredJobOrderModal
      v-model="showDetailDialog"
      :transfer="selectedTransfer"
      :details="transferDetails"
    />
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .responsive-flex-container {
    display: block !important;
  }

  .responsive-table {
    width: 100%;
    margin-right: 0.2rem;
  }
}

.responsive-flex-container {
  display: flex;
  overflow-x: hidden;
  width: 100%;
  height: 80vh;
  padding: 1rem;
}

.responsive-table {
  width: 100%;
}
</style>
