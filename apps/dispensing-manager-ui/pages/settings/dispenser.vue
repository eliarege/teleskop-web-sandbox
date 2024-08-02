<script setup lang="ts">
import { Notify } from 'quasar'
import { outlinedCancel, outlinedCheckCircle, outlinedSignalWifiConnectedNoInternet4, outlinedWarning } from '@quasar/extras/material-icons-outlined'
import { useTimeoutPoll } from '@vueuse/core'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import { DispenserConnectionStatus, colors } from '~/shared/constants'
import { onDrop, onKeydownPreventNonNumerical, onPastePreventNonNumerical, removeAnyNonNumerical } from '~/shared/functions'

const { t } = useI18n()
const rows = ref([])
const types = ref([])
const protocols = [
  { label: '7', protocol: '7' },
  { label: '15', protocol: '15' },
  { label: 'n', protocol: 'n' },
  { label: 'n-v2', protocol: 'n-v2' },
  { label: 'n-v3', protocol: 'n-v3' },
  { label: 'n-v4', protocol: 'n-v4' },
  { label: 'n-v5', protocol: 'n-v5' },
  { label: 'EMTS', protocol: 'EMTS' },
]

await getRows()
await getTypes()
const { data: connectionStatus, refresh: refreshConnectionStatus } = await useFetch<any[]>('/api/settings/dispenser-connection-status', { default: () => [] })
useTimeoutPoll(refreshConnectionStatus, 120000, { immediate: true })

const columns = computed<Array<FilterableTableColumn>>(() => [
  {
    name: 'dispNo',
    label: t('settings.dispSettings.dispNo'),
    field: 'dispNo',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'name',
    label: t('settings.dispSettings.dispName'),
    field: 'name',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'fileSystem',
    label: t('settings.dispSettings.dispFileSystem'),
    field: 'fileSystem',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'fileName',
    label: t('settings.dispSettings.dispFileName'),
    field: 'fileName',
  },
  {
    name: 'protocol',
    label: t('settings.dispSettings.dispProtocol'),
    field: 'protocol',
    filterable: true,
    filterType: 'select',
    selectionOptions: protocols,
    optionLabel: 'label',
    optionValue: 'protocol',
  },
  {
    name: 'connectionStatus',
    label: t('settings.dispSettings.connectionStatus'),
    field: 'connectionStatus',
  },
])

const dispenserInfo = ref<{ label: string, value: any, field: string, options?: Array<any>, controller: 'checkbox' | 'select' | 'input' }[]>([
  { label: t('settings.dispSettings.dispNo'), value: '', field: 'dispNo', controller: 'input' },
  { label: t('settings.dispSettings.dispName'), value: '', field: 'name', controller: 'input' },
  { label: t('settings.dispSettings.dispType'), value: '', field: 'dispType', controller: 'select' },
  { label: t('settings.dispSettings.dispIP'), value: '', field: 'dispIP', controller: 'input' },
  { label: t('settings.dispSettings.dispFileSystem'), value: '', field: 'fileSystem', controller: 'input' },
  { label: t('settings.dispSettings.dispFileName'), value: '', field: 'fileName', controller: 'input' },
  { label: t('settings.dispSettings.dispProtocol'), value: '', field: 'protocol', controller: 'select' },
  { label: t('settings.dispSettings.dispConsumptionFileName'), value: '', field: 'dispConsumptionFileName', controller: 'input' },
  { label: t('settings.dispSettings.exportIrrelevantConsumptions'), value: '', field: 'exportIrrelevantConsumptions', controller: 'checkbox' },
  { label: t('settings.dispSettings.readFromDMS'), value: '', field: 'dms', controller: 'checkbox' },
  { label: t('settings.dispSettings.exportFileName'), value: '', field: 'exportFileName', controller: 'input' },
])

async function getTypes() {
  types.value = await $fetch('/api/settings/dispenser-type')
}

async function getRows() {
  rows.value = await $fetch('/api/settings/dispenser')
  rows.value.unshift({})
}

// const dmsRead = ref(false)
const givenDispenserIdExistsWarning = ref(false)
const dispenserIdErrorMessage = ref('')

function resetDispenserInfo(row?: any) {
  dispenserInfo.value.forEach((disp) => {
    disp.field === 'dispType'
      ? types.value.forEach((type: { type: number, name: string }) => type.type === row[disp.field] ? disp.value = type : '')
      : disp.controller === 'checkbox'
        ? disp.value = row[disp.field] !== undefined ? row[disp.field] : false
        : disp.value = row[disp.field]
  })
}

async function applyFilters(updatedValue: any) {
  rows.value = await $fetch('/api/settings/filtered-dispenser', {
    method: 'POST',
    body: updatedValue,
  })
  rows.value.unshift({})
}

const expandedRow: Ref<number | null> = ref(null)
const submitDialog = ref(false)

async function toggleRowExpand(row: any, index: number) {
  if (expandedRow.value === index) {
    expandedRow.value = null
  } else {
    expandedRow.value = index
  }
  resetDispenserInfo(row)
}

function showSubmitDialog() {
  submitDialog.value = true
}

async function toggleRow(row: any, index: number, toggleCollapse: boolean) {
  givenDispenserIdExistsWarning.value = false
  if (toggleCollapse)
    await toggleRowExpand(row, index)
  else {
    let canContinue = true
    if (expandedRow.value) {
      canContinue = !isFormChangedComparison()
    }
    if (canContinue)
      toggleRowExpand(row, index)
    else
      showSubmitDialog()
  }
}

function isFormChangedComparison() {
  const actualData = rows.value.find(el => el.dispNo === dispenserInfo.value.find(el => el.field === 'dispNo')?.value)
  if (!actualData?.dispNo)
    return false
  const isThereAnyChange = dispenserInfo.value.some((element) => {
    if (element.field === 'dispType')
      return (
        actualData![element.field] !== element.value.type
      )
    else
      return actualData![element.field] !== element.value
  })
  return isThereAnyChange
}

function customSortMethod(rows, sortBy, descending) {
  expandedRow.value = null
  if (!sortBy) {
    return rows
  }

  const sortedRows = [...rows]

  const firstRow = sortedRows.shift()

  sortedRows.sort((a, b) => {
    if (descending) {
      return a[sortBy] < b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] > b[sortBy] ? 1 : -1
    }
  })

  sortedRows.unshift(firstRow)

  return sortedRows
}

function notification(isSuccess: any, message: string) {
  Notify.create({
    message,
    type: isSuccess ? 'positive' : 'warning',
    position: 'top',
  })
}

async function submit(isPut: boolean) {
  let isSuccess
  let keyI18N

  const dispenserValues: any = dispenserInfo.value.reduce((acc, curr) => {
    acc[curr.field] = curr.value
    return acc
  }, {})
  const body = {
    ...dispenserValues,
    protocol: dispenserValues?.protocol?.protocol ? dispenserValues.protocol.protocol : protocols[0].protocol,
    dispType: dispenserValues.dispType.type,
  }
  console.log(dispenserValues)
  /** If create */
  if (!isPut) {
    isSuccess = await $fetch(`/api/settings/dispenser/${body.dispNo}`, {
      method: 'post',
      body,
    })
    keyI18N = 'warnings.createResponse'
    expandedRow.value = null
  } else { /** If it is put */
    isSuccess = await $fetch(`/api/settings/dispenser/${body.dispNo}`, {
      method: 'put',
      body,
    })
    keyI18N = 'warnings.changeResponse'
  }
  notification(
    isSuccess && isSuccess?.code !== 400,
    t(keyI18N!, {
      type: t('warnings.dispenser'),
      result: isSuccess
        ? isSuccess?.code === 400
          ? t('warnings.idAlreadyExists', { code: dispenserValues.dispNo, type: t('warnings.dispenser') })
          : t('warnings.success')
        : t('warnings.fail'),
    }),
  )
  await getRows()
  expandedRow.value = null
}
const cancelDialogVisible = ref(false)
async function deleteRow() {
  const isSuccess = await $fetch(`/api/settings/dispenser/${dispenserInfo.value[0].value}`, {
    method: 'delete',
  })
  if (isSuccess.isConnectedMaterialExist || isSuccess.isConnectedMachineExist) {
    let connectedThings = ''
    if (isSuccess.isConnectedMachineExist) {
      if (isSuccess.isConnectedMaterialExist)
        connectedThings = `${t('warnings.machine')} ${t('warnings.and')} ${t('warnings.material')}`
      else
        connectedThings = t('warnings.machine')
    } else
      connectedThings = t('warnings.material')

    notification(false, t('warnings.dispenserDeleteExistingMachineOrMaterial', {
      connectedThings,
    }))
  } else
    notification(isSuccess, t('warnings.deleteResponse', { type: t('warnings.dispenser'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))
  expandedRow.value = null
  /**
   * I did not reset the dispenserInfo array careful. It has to be
   * set before use so it will not be a problem but in case
   * to relocate buttons on top of the screen can be example where we boomed
   */
  await getRows()
}

async function checkDispenserCodeExist(disp: { value: number | null }, value: InputEvent) {
  disp.value = value
  if (value) {
    if (value.startsWith('0')) {
      givenDispenserIdExistsWarning.value = true
      dispenserIdErrorMessage.value = t('warnings.cannotBeZero', { type: t('warnings.dispenser') })
    } else {
      if (disp.value)
        givenDispenserIdExistsWarning.value = await $fetch(`/api/settings/check-is-dispenser-exist/${disp.value}`)
      if (givenDispenserIdExistsWarning.value)
        dispenserIdErrorMessage.value = t('warnings.idAlreadyExistsOnBlue', { code: disp.value, type: t('warnings.dispenser') })
    }
  } else {
    givenDispenserIdExistsWarning.value = false
  }
}

onBeforeRouteLeave(async (to, from, next) => {
  let check = false
  if (expandedRow.value)
    check = isFormChangedComparison()
  if (check) {
    showSubmitDialog()
    next(false)
  } else {
    next()
  }
})

function getConnectionStatus(dispNo: number) {
  return connectionStatus.value.find(stat => stat.dispNo === dispNo)?.connectionStatus
}
const pagination = ref({ rowsPerPage: 0 })
</script>

<template>
  <FilterableTable
    v-model:pagination="pagination"
    :rows="rows"
    row-key="name"
    :columns="columns"
    :is-expandable="true"
    :empty-first-row="true"
    style="height: 85vh;"
    :custom-sort-method="customSortMethod"
    @update-filter-slots="(evt) => applyFilters(evt)"
  >
    <template #custombody="props">
      <q-tr :props="props">
        <q-td
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex, false)"
        >
          <q-btn
            v-if="props.row.dispNo || props.rowIndex !== 0"
            size="sm"
            :style="`background-color: ${colors.black}; color: white;`"
            round
            dense
            :icon="props.rowIndex === expandedRow ? 'expand_less' : 'expand_more'"
          />
          <q-btn
            v-else
            outline
            :style="'color:' + ` ${colors.black} ` + 'font-weight: bold; font-size: larger; '"
            :label="t('settings.new')"
            class="w-30"
            :icon="props.rowIndex === expandedRow ? 'remove' : 'add'"
          />
        </q-td>
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex, false)"
        >
          <span v-if="col.name === 'connectionStatus' && props.rowIndex">
            <q-icon
              v-bind="getConnectionStatusIcon(getConnectionStatus(props.row.dispNo))"
              size="sm"
            >
              <q-tooltip class="text-sm">
                {{ t(`dispenserConnectionStatus.${getConnectionStatus(props.row.dispNo)}`) }}
              </q-tooltip>
            </q-icon>
          </span>
          <span v-else>
            {{ col.value }}
          </span>
        </q-td>
      </q-tr>

      <q-tr v-if="props.rowIndex === expandedRow" :props="props">
        <q-td colspan="100%">
          <div class="flex justify-center pt-5">
            <div
              v-for="disp in dispenserInfo"
              :key="disp.label"
              class="flex flex-row"
            >
              <div class="flex w w-70 pl-2 m-1 items-center">
                {{ disp.controller !== 'checkbox' ? disp.label : '' }}
              </div>
              <div class="flex w-100 pl-2 m-1 items-center">
                <span v-if="disp.controller === 'select'">
                  <q-select
                    v-model="disp.value"
                    borderless
                    dense
                    filled
                    class="w-70"
                    options-dense
                    :options="disp.field === 'protocol' ? protocols : types"
                    :option-label="disp.field === 'protocol' ? 'label' : 'name'"
                    :option-value="disp.field === 'protocol' ? 'label' : 'type'"
                    style="min-width: 150px;"
                  />
                </span>
                <span v-else-if="disp.field === 'dispNo'">
                  <q-input
                    :model-value="disp.value"
                    class="w-70"
                    dense
                    filled
                    :error="givenDispenserIdExistsWarning"
                    :error-message="dispenserIdErrorMessage"
                    :placeholder="disp.value"
                    :disable="props.row.dispNo > 0"
                    @keydown="(e) => onKeydownPreventNonNumerical(e, disp.value)"
                    @paste="onPastePreventNonNumerical"
                    @drop="onDrop"
                    @update:model-value="checkDispenserCodeExist(disp, $event)"
                  />
                </span>
                <span v-else-if="disp.controller === 'input'">
                  <q-input
                    v-model="disp.value"
                    class="w-70"
                    dense
                    filled
                    :disable="disp.field === 'exportFileName' ? dispenserInfo.find(el => el.field === 'exportIrrelevantConsumptions')!.value : false"
                    type="text"
                    :placeholder="disp.value"
                  />
                </span>
                <span v-if="disp.controller === 'checkbox'">
                  <q-checkbox v-model="disp.value" :label="disp.label" />
                </span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-5 py-10 w-full">
              <q-btn
                color="black"
                :label="props.rowIndex || props.row.dispNo ? t('settings.submit') : t('settings.new')"
                :disable="dispenserInfo[0].value === undefined || dispenserInfo[0].value === '' || givenDispenserIdExistsWarning"
                outline
                icon="done"
                @click="submit(props.rowIndex || props.row.dispNo)"
              />
              <q-btn
                color="black"
                :label="t('settings.cancel')"
                icon="close"
                outline
                @click="toggleRow(props.row, props.rowIndex, true)"
              />
              <q-btn
                v-if="props.rowIndex"
                color="red"
                :label="t('settings.delete')"
                icon="delete"
                outline
                @click="cancelDialogVisible = true"
              />
            </div>
          </div>
        </q-td>
      </q-tr>
    </template>
  </FilterableTable>
  <q-dialog v-model="cancelDialogVisible" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar
          icon="delete"
          color="white"
          text-color="delete"
        />
        <span class="q-ml-sm"> {{ t('warnings.deleteRow') }}</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('settings.cancel')"
          outline
          color="black"
          icon="close"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('settings.delete')"
          color="red"
          icon="delete"
          @click="deleteRow()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="submitDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar
          icon="question_mark"
        />
        <span class="q-ml-sm"> {{ t('warnings.formDidnotSubmit', { type: t('warnings.dispenser') }) }}</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('settings.discard')"
          outline
          color="red"
          icon="close"
          @click="expandedRow = null"
        />
        <q-btn
          v-close-popup
          outline
          :label="t('settings.submit')"
          color="light-blue-10"
          icon="done_all"
          @click="submit(true)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.settings-section-header {
  align-items: center;
  font-size: x-large;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 55%;
  margin: 1.25rem;
}
</style>
