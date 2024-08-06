<script setup lang="ts">
import { Notify } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import ConnectMultiDispenserDialog from '~/components/ConnectMultiDispenserDialog.vue'
import { colors } from '~/shared/constants'
import { onDrop, onKeydownPreventNonNumerical, onPastePreventNonNumerical, removeAnyNonNumerical } from '~/shared/functions'

const keycloak = useKeycloak()

const { t } = useI18n()
const rows = ref([])
const disps = ref([])
const $q = useQuasar()

await getRows()
await getDisps()

const machines = await keycloak.fetch('/api/machine/machines')

const controlDevices = [
  { controlDevice: 0, label: t('settings.noProgramator') }, // TODO:
  { controlDevice: 1, label: 'Eliar' },
  { controlDevice: 2, label: 'Sedo' },
  { controlDevice: 3, label: 'Setex' },
  { controlDevice: 4, label: 'Termo' },
  { controlDevice: 5, label: 'Tonello' },
]

const columns = computed<Array<FilterableTableColumn>>(() => [
  {
    name: 'machineid',
    label: t('settings.machineCode'),
    field: 'machineid',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'machinename',
    label: t('settings.machinename'),
    field: 'machinename',
    filterable: true,
    filterType: 'select',
    selectionOptions: machines,
    optionLabel: 'machinename',
    optionValue: 'machineid',
  },
  {
    name: 'disps',
    label: t('settings.connectedDisps'),
    field: 'disps',
    format: (val, row) => {
      return val?.length ? val.map(disp => disps.value.find(dispenser => dispenser.dispNo === disp)?.name).join(', ') : ''
    },
    // filterable: true,
    // filterType: 'multiselect',
    // selectionOptions: disps.value,
    // optionLabel: 'name',
    // optionValue: 'dispNo',
  },
])

const machineInfo = ref<{ label: string, value: any, field: string }[]>([
  { label: t('settings.machineCode'), value: '', field: 'machineid' },
  { label: t('settings.machinename'), value: '', field: 'machinename' },
  { label: t('settings.controlMach'), value: '', field: 'controlDevice' },
  { label: t('settings.connectedDisps'), value: '', field: 'connectedDisps' },
])

const givenMachineIdExistsWarning = ref(false)
const machineIdErrorMessage = ref('')

async function getRows() {
  rows.value = await keycloak.fetch('/api/settings/machine-dispenser-connection-filtered', {
    method: 'POST',
  })
  rows.value.unshift({})
}

async function getDisps() {
  disps.value = await keycloak.fetch('/api/settings/dispenser')
}

function resetMachineInfo(row?: any) {
  machineInfo.value.forEach((mach) => {
    if (mach.field === 'controlDevice') {
      controlDevices.forEach(dev => dev.controlDevice === row[mach.field] ? mach.value = dev : '')
    } else if (mach.field === 'connectedDisps') {
      mach.value = row.disps ? row.disps : []
    } else {
      mach.value = row[mach.field]
    }
  })
}

async function applyFilters(updatedValue: any) {
  rows.value = await keycloak.fetch('/api/settings/machine-dispenser-connection-filtered', {
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
  resetMachineInfo(row)
}

async function toggleRow(row: any, index: number, toggleCollapse: boolean) {
  givenMachineIdExistsWarning.value = false
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

function showSubmitDialog() {
  submitDialog.value = true
}

function isFormChangedComparison() {
  const actualData = rows.value.find(el => el.machineid === machineInfo.value[0].value)
  if (!actualData?.machineid)
    return false
  const isThereAnyChange = machineInfo.value.some((element) => {
    if (element.field === 'controlDevice')
      return (
        actualData[element.field] !== element.value.controlDevice
      )
    else if (element.field === 'connectedDisps')
      return actualData.disps !== element.value
    else
      return actualData[element.field] !== element.value
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
  const body = {
    machineid: machineInfo.value[0].value,
    machinename: machineInfo.value[1]?.value,
    controlDevice: machineInfo.value[2].value?.controlDevice,
    disps: machineInfo.value[3]?.value,
  }
  /** If create */
  if (!isPut) {
    isSuccess = await keycloak.fetch(`/api/settings/machine-dispenser-connection/${body.machineid}`, {
      method: 'post',
      body,
    })
    keyI18N = 'warnings.createResponse'

    expandedRow.value = null
  }
  if (isPut) { /** If it is put */
    isSuccess = await keycloak.fetch(`/api/settings/machine-dispenser-connection/${body.machineid}`, {
      method: 'put',
      body,
    })
    keyI18N = 'warnings.changeResponse'
  }
  notification(
    isSuccess && isSuccess?.code !== 400,
    t(keyI18N!, {
      type: t('warnings.machine'),
      result: isSuccess
        ? isSuccess?.code === 400
          ? t('warnings.idAlreadyExists', {
            code: machineInfo.value[0].value,
            type: t('warnings.machine'),
          })
          : t('warnings.success')
        : t('warnings.fail'),
    }),
  )
  await getRows()
  expandedRow.value = null
}

const cancelDialogVisible = ref(false)
async function deleteRow() {
  const isSuccess = await keycloak.fetch(`/api/settings/machine-dispenser-connection/${machineInfo.value[0].value}`, {
    method: 'delete',
  })
  expandedRow.value = null
  notification(isSuccess, t('warnings.deleteResponse', { type: t('warnings.machine'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))
  await getRows()
  expandedRow.value = null
}

async function checkMachineIdExist(mach: { value: number | null }, value: InputEvent) {
  mach.value = value
  if (value) {
    if (value.startsWith('0')) {
      givenMachineIdExistsWarning.value = true
      machineIdErrorMessage.value = t('warnings.cannotBeZero', { type: t('warnings.machine') })
    } else {
      if (mach.value)
        givenMachineIdExistsWarning.value = await keycloak.fetch(`/api/settings/check-is-machine-exist/${machineInfo.value[0].value}`)
      if (givenMachineIdExistsWarning.value)
        machineIdErrorMessage.value = t('warnings.idAlreadyExistsOnBlue', { code: machineInfo.value[0].value, type: t('warnings.machine') })
    }
  } else {
    givenMachineIdExistsWarning.value = false
  }
}
async function handleMultiEdit() {
  const dispensers = disps.value.map((disp) => {
    return { label: `${disp.dispNo} - ${disp.name}`, value: disp.dispNo }
  })
  $q.dialog({
    component: ConnectMultiDispenserDialog,
    componentProps: {
      objectList: machines,
      objectKey: 'machinename',
      objectValue: 'machineid',
      dispensers,
    },
  }).onOk(async (response: MultiDispenserDialogResponseType) => {
    const body = {
      machineList: response.selectedObjects.map(mach => mach.machineid),
      dispenserList: response.selectedDispensers,
    }
    const operation = response.isReplace ? 'replace' : 'add'
    const status = await keycloak.fetch(`/api/settings/${operation}-machine-dispenser-connection`, {
      method: 'POST',
      body,
    })
    await getRows()
    notification(status, status ? t('multiEditDialog.successWarning') : t('multiEditDialog.failWarning'))
  })
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
const pagination = ref({ rowsPerPage: 0 })
</script>

<template>
  <FilterableTable
    v-model:pagination="pagination"
    :rows="rows"
    :columns="columns"
    :is-expandable="true"
    :empty-first-row="true"
    style="height: 90vh;"
    :custom-sort-method="customSortMethod"
    @update-filter-slots="(evt) => applyFilters(evt)"
  >
    <template #top-right>
      <div class="items-center flex justify-center h-full">
        <q-btn
          outline
          class="p-2"
          icon="edit"
          @click="handleMultiEdit"
        >
          <q-tooltip
            class="text-body2"
          >
            {{ t('multiEditDialog.tooltip') }}
          </q-tooltip>
        </q-btn>
      </div>
    </template>
    <template #custombody="props">
      <q-tr :props="props">
        <q-td
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex, false)"
        >
          <q-btn
            v-if="props.row.machineid || props.rowIndex !== 0"
            size="sm"
            :style="`background-color: ${colors.black}; color: white;`"
            round
            dense
            :icon="props.rowIndex === expandedRow ? 'expand_less' : 'expand_more'"
          />
          <q-btn
            v-else
            outline
            class="w-30"
            :style="`color: ${colors.black}; font-weight: bold; font-size: larger;`"
            :label="t('settings.new')"
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
          <span v-if="col.field === 'controlDevice'">
            {{ controlDevices[col.value]?.label }}
          </span>
          <span v-else>
            {{ col.value }}
          </span>
        </q-td>
      </q-tr>

      <q-tr v-if="props.rowIndex === expandedRow" :props="props">
        <q-td colspan="100%">
          <div class="flex flex-row justify-center pt-5">
            <div class="flex flex-col justify-center">
              <div
                v-for="mach in machineInfo.slice(0, -1)"
                :key="mach.label"
                class="flex mt-1"
              >
                <div v-if="mach.field !== 'connectedDisps'" class="flex w-70 pl-2 m-1 items-center">
                  {{ mach.label }}
                </div>
                <div v-if="mach.field !== 'connectedDisps'" class=" flex w-100 pl-2 m-1 items-center ">
                  <span v-if="mach.field === 'controlDevice'">
                    <q-select
                      v-model="mach.value"
                      borderless
                      dense
                      filled
                      class="w-70"
                      options-dense
                      :options="controlDevices"
                      option-value="controlDevice"
                      option-label="label"
                      style="min-width: 150px"
                    />
                  </span>
                  <span v-else-if="mach.field === 'machineid'">
                    <q-input
                      :model-value="mach.value"
                      dense
                      class="w-70"
                      filled
                      type="number"
                      :error="givenMachineIdExistsWarning"
                      :error-message="machineIdErrorMessage"
                      :placeholder="mach.value"
                      :disable="props.row.machineid > 0"
                      @keydown="(e) => onKeydownPreventNonNumerical(e, mach.value)"
                      @paste="onPastePreventNonNumerical"
                      @drop="onDrop"
                      @update:model-value="checkMachineIdExist(mach, $event)"
                    />
                  </span>
                  <span v-else>
                    <q-input
                      v-model="mach.value"
                      dense
                      class="w-70"
                      filled
                      type="text"
                      :placeholder="mach.value"
                    />

                  </span>
                </div>
              </div>
            </div>
            <div class="flex justify-center gap-5">
              <!-- Container for the right side div -->
              <div v-if="machineInfo[3].field === 'connectedDisps'" class="flex max-h-60 pl-2 items-center ">
                {{ machineInfo[3].label }}
              </div>
              <div
                class="flex max-h-60 overflow-y-scroll"
              >
                <span
                  class="flex flex-col"
                >
                  <q-checkbox
                    v-for="dispenser in disps"
                    :key="dispenser.dispNo"
                    v-model="machineInfo[3].value"
                    :val="dispenser.dispNo"
                    :label="dispenser.name"
                  />
                  <!-- <q-select
                    v-model="mach.value"
                    borderless
                    multiple
                    dense
                    filled
                    class="w-70 overflow-hidden"
                    options-dense
                    :options="disps"
                    option-value="dispNo"
                    option-label="name"
                    style="min-width: 150px"
                  /> -->
                  <!-- :display-value=" mach.value && mach.value.length > 1 ? `${mach.value[0]?.name} + ${mach.value?.length - 1} ${t('more')}` : mach.value[0]?.name" -->
                </span>
              </div>
            </div>

            <div class="flex items-center justify-center gap-5 py-10 w-full">
              <q-btn
                color="black"
                :label="props.row.machineid || props.rowIndex !== 0 ? t('settings.submit') : t('settings.new')"
                outline
                :disable="machineInfo[0].value === undefined || machineInfo[0].value === '' || givenMachineIdExistsWarning"
                icon="done"
                @click="submit(props.rowIndex || props.row.machineid)"
              />
              <q-btn
                color="black"
                :label="t('settings.cancel')"
                icon="close"
                outline
                @click="toggleRow(props.row, props.rowIndex, true)"
              />
              <q-btn
                v-if="props.row.machineid || props.rowIndex !== 0"
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
  <!-------------------------------------------------------------------------------------->
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
