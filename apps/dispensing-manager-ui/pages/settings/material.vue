<script setup lang="ts">
import { Notify } from 'quasar'
import type { FilterableTableColumn } from '@teleskop/nuxt-base'
import ConnectMultiDispenserDialog from '~/components/ConnectMultiDispenserDialog.vue'
import { colors } from '~/shared/constants'
import { onDrop, onKeydownPreventNonNumerical, onPastePreventNonNumerical, removeAnyNonNumerical } from '~/shared/functions'

const keycloak = useKeycloak()

const { t } = useI18n()
const rows = ref<any[]>([])
const disps = ref([])
const $q = useQuasar()

await getRows()
await getDisps()
const materialGroups = [
  { label: t('chemical'), materialGroup: 1 },
  { label: t('dye'), materialGroup: 2 },
  { label: t('settings.other'), materialGroup: 3 },
]

const columns = computed<Array<FilterableTableColumn>>(() => [
  {
    name: 'materialCode',
    label: t('settings.materialCode'),
    field: 'materialCode',
    filterable: true,
    filterType: 'includes',
    headerClasses: 'w-40',
  },
  {
    name: 'materialName',
    label: t('settings.materialName'),
    field: 'materialName',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'materialGroup',
    label: t('settings.materialType'),
    field: 'materialGroup',
    filterable: true,
    filterType: 'select',
    optionLabel: 'label',
    optionValue: 'materialGroup',
    selectionOptions: materialGroups,
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

const materialInfo = ref<{ label: string, value: any, field: string, numeric?: boolean }[]>([
  { label: t('settings.materialCode'), value: '', field: 'materialCode' },
  { label: t('settings.materialName'), value: '', field: 'materialName' },
  { label: t('settings.materialType'), value: '', field: 'materialGroup' },
  { label: t('settings.materialDensity'), value: '', field: 'density', numeric: true },
  { label: 'pH', value: '', field: 'ph', numeric: true },
  { label: t('settings.supplySource'), value: '', field: 'source' },
  { label: t('settings.materialKgPrice'), value: '', field: 'cost', numeric: true },
  { label: t('settings.rerequestable'), value: '', field: 'rerequestable' },
  { label: t('settings.directlyTransfer'), value: '', field: 'directTransfer' },
  { label: t('settings.connectedDisps'), value: '', field: 'connectedDisps' },

])

async function getRows() {
  rows.value = await keycloak.fetch('/api/settings/material-dispenser-connection-filtered', {
    method: 'POST',
  })
  rows.value.unshift({})
}

async function getDisps() {
  disps.value = await keycloak.fetch('/api/settings/dispenser')
}

async function resetMaterialInfo(row: any) {
  materialInfo.value.forEach((mate) => {
    if (mate.field === 'materialGroup') {
      materialGroups.forEach(dev => dev.materialGroup === row[mate.field] ? mate.value = dev : '')
    } else if (mate.field === 'directTransfer' || mate.field === 'rerequestable') {
      row[mate.field] === undefined ? mate.value = false : mate.value = row[mate.field]
    } else if (mate.field === 'connectedDisps') {
      mate.value = row.disps ? row.disps : []
    } else {
      mate.value = row[mate.field]
    }
  })
}

async function applyFilters(updatedValue: any) {
  rows.value = await keycloak.fetch('/api/settings/material-dispenser-connection-filtered', {
    method: 'POST',
    body: updatedValue,
  })
  rows.value.unshift({})
}

const expandedRow: Ref<number | null> = ref(null)
const submitDialog = ref(false)
const givenMaterialCodeExistsWarning = ref(false)
const materialCodeErrorMessage = ref('')

async function toggleRowExpand(row: any, index: number) {
  if (expandedRow.value === index) {
    expandedRow.value = null
  } else {
    expandedRow.value = index
  }
  resetMaterialInfo(row)
}

function showSubmitDialog() {
  submitDialog.value = true
}

async function toggleRow(row: any, index: number, toggleCollapse: boolean) {
  givenMaterialCodeExistsWarning.value = false
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
  const actualData = rows.value.find(el => el.materialCode === materialInfo.value[0].value)
  if (!actualData?.materialCode)
    return false
  const isThereAnyChange = materialInfo.value.some((element) => {
    if (element.field === 'materialGroup')
      return (
        actualData![element.field] !== element.value.materialGroup
      )
    else if (element.field === 'connectedDisps')
      return actualData.disps !== element.value
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
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

async function submit(isPut: boolean) {
  let isSuccess
  let keyI18N

  const ph = clamp(materialInfo.value[4]?.value, 1, 14)
  const body = {
    materialCode: materialInfo.value[0].value,
    materialName: materialInfo.value[1]?.value || '',
    materialGroup: materialInfo.value[2].value?.materialGroup,
    density: materialInfo.value[3]?.value,
    ph,
    source: materialInfo.value[5]?.value,
    cost: materialInfo.value[6]?.value,
    rerequestable: materialInfo.value[7]?.value,
    directTransfer: materialInfo.value[8]?.value,
    connectedDisps: materialInfo.value[9]?.value,
  }
  /** If create */
  if (!isPut) {
    isSuccess = await keycloak.fetch(`/api/settings/material-connection/${body.materialCode}`, {
      method: 'post',
      body,
    })
    keyI18N = 'warnings.createResponse'
    expandedRow.value = null
  }
  if (isPut) { /** If it is put */
    isSuccess = await keycloak.fetch(`/api/settings/material-connection/${body.materialCode}`, {
      method: 'put',
      body,
    })
    keyI18N = 'warnings.changeResponse'
  }
  notification(
    isSuccess && isSuccess?.code !== 400,
    t(keyI18N!, {
      type: t('warnings.material'),
      result: isSuccess
        ? isSuccess?.code === 400
          ? t('warnings.idAlreadyExists', { code: materialInfo.value[0].value, type: t('warnings.material') })
          : t('warnings.success')
        : t('warnings.fail'),
    }),
  )
  await getRows()
  expandedRow.value = null
}
const cancelDialogVisible = ref(false)
async function deleteRow() {
  const isSuccess = await keycloak.fetch(`/api/settings/material/${materialInfo.value[0].value}`, {
    method: 'delete',
  })
  expandedRow.value = null
  notification(isSuccess, t('warnings.deleteResponse', { type: t('warnings.material'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))

  /**
   * I did not reset the dispenserInfo array be careful. It has to be
   * set before use so it will not be a problem but in case
   * to relocate filtering buttons on top of the screen can be example where we boomed
   */
  await getRows()
}

async function checkMaterialCodeExist() {
  if (materialInfo.value[0]?.value[0] === '0') {
    givenMaterialCodeExistsWarning.value = true
    materialCodeErrorMessage.value = t('warnings.cannotBeZero', { type: t('warnings.material') })
  } else if (materialInfo.value[0].value) {
    givenMaterialCodeExistsWarning.value = await keycloak.fetch(`/api/settings/check-is-material-exist/${materialInfo.value[0].value}`)
    if (givenMaterialCodeExistsWarning.value)
      materialCodeErrorMessage.value = t('warnings.idAlreadyExistsOnBlue', { code: materialInfo.value[0].value, type: t('warnings.material') })
  } else {
    givenMaterialCodeExistsWarning.value = false
  }
}
async function handleMultiEdit() {
  const materials = await keycloak.fetch('/api/settings/materials-key-value')
  const dispensers = disps.value.map((disp) => {
    return { label: `${disp.dispNo} - ${disp.name}`, value: disp.dispNo }
  })
  $q.dialog({
    component: ConnectMultiDispenserDialog,
    componentProps: {
      toEdit: 'materials',
      objectList: materials,
      objectKey: 'materialLabel',
      objectValue: 'materialCode',
      dispensers,
    },
  }).onOk(async (response: MultiDispenserDialogResponseType) => {
    const body = {
      materialList: response.selectedObjects.map(mate => mate.materialCode),
      dispenserList: response.selectedDispensers,
    }
    const operation = response.isReplace ? 'replace' : 'add'
    const status = await keycloak.fetch(`/api/settings/${operation}-material-dispenser-connection`, {
      method: 'POST',
      body,
    })
    await getRows()
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
    style="height: 90vh;"
    :empty-first-row="true"
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
          class="cursor-pointer"
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          @click="toggleRow(props.row, props.rowIndex, false)"
        >
          <q-btn
            v-if="props.row.materialCode || props.rowIndex"
            size="sm"
            :style="`background-color: ${colors.black}; color: white;`"
            round
            dense
            :icon="props.rowIndex === expandedRow ? 'expand_less' : 'expand_more'"
          />
          <q-btn
            v-else
            outline
            :style="`color: ${colors.black}; font-weight: bold; font-size: larger; `"
            :label="t('settings.new')"
            class="w-30"
            :icon="props.rowIndex === expandedRow ? 'remove' : 'add'"
          />
        </q-td>
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          :props="props"
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex, false)"
        >
          <span v-if="col.field === 'materialGroup' && col.value !== undefined">
            {{ t(`recipeTypes.${col.value - 1}`) }}
          </span>
          <span v-else>
            {{ col.value }}
          </span>
        </q-td>
      </q-tr>

      <q-tr
        v-if="props.rowIndex === expandedRow"
        :props="props"
        class="expanded-row"
      >
        <q-td colspan="100%">
          <div class="flex">
            <div class="flex pt-5 w-3/4 justify-center">
              <div
                v-for="mate in materialInfo.slice(0, -1)"
                :key="mate.label"
                class="flex mt-1"
              >
                <div class="flex class-w-70 m-1 items-center">
                  {{ mate.label }}
                </div>
                <div class=" flex class-w-100 pl-2 m-1">
                  <span v-if="mate.field === 'materialGroup'">
                    <q-select
                      v-model="mate.value"
                      borderless
                      dense
                      filled
                      class="class-w-70"
                      options-dense
                      :options="materialGroups"
                      option-value="materialGroup"
                      option-label="label"
                      style="min-width: 150px"
                    />
                  </span>
                  <span v-else-if="mate.field === 'directTransfer' || mate.field === 'rerequestable'">
                    <q-checkbox v-model="mate.value" />
                  </span>
                  <span v-else-if="mate.field === 'materialCode'">
                    <q-input
                      v-model="mate.value"
                      dense
                      class="class-w-70"
                      filled
                      :error="givenMaterialCodeExistsWarning"
                      :error-message="materialCodeErrorMessage"
                      type="text"
                      :placeholder="mate.value"
                      :disable="props.row.materialCode !== undefined && mate.field === 'materialCode'"
                      @update:model-value="checkMaterialCodeExist()"
                    />
                  </span>
                  <span v-else>
                    <q-input
                      v-model="mate.value"
                      dense
                      class="class-w-70"
                      filled
                      :type="mate.numeric ? 'number' : 'text'"
                      :min="mate.field === 'ph' ? 1 : 0"
                      :max="mate.field === 'ph' ? 14 : ''"
                      :placeholder="mate.value"
                      @keydown="(e) => mate.numeric ? onKeydownPreventNonNumerical(e, mate.value) : {}"
                      @paste="(e) => mate.numeric ? onPastePreventNonNumerical(e) : {}"
                      @drop="(e) => mate.numeric ? onDrop(e) : {}"
                    />
                    <!-- @update:model-value="evt => mate.value = removeAnyNonNumerical(evt)" -->
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col w-1/4">
              <div class="flex max-h-60 pl-2 items-center ">
                {{ materialInfo[materialInfo.length - 1].label }}
              </div>
              <div class="flex max-h-60 overflow-y-scroll">
                <span class="flex flex-col">
                  <q-checkbox
                    v-for="dispenser in disps"
                    :key="dispenser.dispNo"
                    v-model="materialInfo[materialInfo.length - 1].value"
                    :val="dispenser.dispNo"
                    :label="dispenser.name"
                  />
                </span>
              </div>
              <!-- :display-value=" mate.value && mate.value.length > 1 ? `${mate.value[0]?.name} + ${mate.value?.length - 1} ${t('more')}` : mate.value[0]?.name" -->
            </div>
          </div>
          <div class="flex items-center justify-center gap-5 py-10 w-full">
            <q-btn
              color="black"
              :label="props.rowIndex || props.row.materialCode ? t('settings.submit') : t('settings.new')"
              outline
              :disable="materialInfo[0].value === undefined || materialInfo[0].value === '' || givenMaterialCodeExistsWarning"
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
.class-w-70 {
  width: 14rem;
}
.class-w-100 {
  width: 18rem;
}
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
