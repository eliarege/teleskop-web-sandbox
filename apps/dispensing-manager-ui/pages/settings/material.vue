<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import { Notify } from 'quasar'
import { colors } from '~/shared/constants'
import type { Column } from '~/shared/types'

const { t } = useI18n()
const rows = ref([])
const disps = ref([])

await getRows()
await getDisps()

const columns: Array<Column> = [
  {
    name: 'materialName',
    label: t('settings.materialName'),
    field: 'materialName',
    filterable: true,
  },
  {
    name: 'materialCode',
    label: t('settings.materialCode'),
    field: 'materialCode',
    filterable: true,
  },
  {
    name: 'materialGroup',
    label: t('settings.materialType'),
    field: 'materialGroup',
    filterable: true,
  },
]

const materialGroups = [
  { label: t('dye'), value: 1 },
  { label: t('chemical'), value: 2 },
  { label: t('settings.other'), value: 3 },
]

let materialInfoStatic: { label: string; value: any; field: string }[] = []

const materialInfo = ref<{ label: string; value: any; field: string; numeric?: boolean }[]>([
  { label: t('settings.materialCode'), value: '', field: 'materialCode' },
  { label: t('settings.materialName'), value: '', field: 'materialName' },
  { label: t('settings.materialType'), value: '', field: 'materialGroup' },
  { label: t('settings.materialDensity'), value: '', field: 'density', numeric: true },
  { label: 'pH', value: '', field: 'ph', numeric: true },
  { label: t('settings.supplySource'), value: '', field: 'source' },
  { label: t('settings.materialKgPrice'), value: '', field: 'cost', numeric: true },
  { label: t('settings.connectedDisps'), value: '', field: 'connectedDisps' },
  { label: t('settings.rerequestable'), value: '', field: 'rerequestable' },
  { label: t('settings.directlyTransfer'), value: '', field: 'directTransfer' },

])

async function getRows() {
  rows.value = await $fetch('/api/settings/material')
  rows.value.unshift({})
}

async function getDisps() {
  disps.value = await $fetch('/api/settings/dispenser')
}

async function resetMaterialInfo(row?: any) {
  const mateDispsTemp = await $fetch(`/api/settings/material-connections?chemCode=${row.materialCode}`)
  materialInfo.value.forEach((mate) => {
    if (mate.field === 'materialGroup') {
      materialGroups.forEach(dev => dev.value === row[mate.field] ? mate.value = dev : '')
    } else if (mate.field === 'connectedDisps') {
      mate.value = mateDispsTemp
    } else if (mate.field === 'directTransfer' || mate.field === 'rerequestable') {
      row[mate.field] === undefined ? mate.value = false : mate.value = row[mate.field]
    } else {
      mate.value = row[mate.field]
    }
  })
}

function checkIsThereAnyChange() {
  console.log(materialInfoStatic)
  console.log(materialInfo.value)
  if (materialInfoStatic === materialInfo.value || !materialInfoStatic.length)
    return false
  return true
}

const expandedRow = ref()

function toggleRow(row: any, index: number) {
  expandedRow.value === index
    ? expandedRow.value = null
    : expandedRow.value = index
  console.log(materialInfo.value)
  materialInfoStatic = materialInfo.value
  resetMaterialInfo(row)
}

function customSortMethod(rows, sortBy, descending) {
  expandedRow.value = null
  if (!sortBy) {
    return rows
  }

  // Clone the rows array to avoid mutating the original data
  const sortedRows = [...rows]

  // Remove the first row from the sorting process
  const firstRow = sortedRows.shift()

  // Apply your sorting logic here
  // Example sorting logic (adjust as needed):
  sortedRows.sort((a, b) => {
    if (descending) {
      return a[sortBy] < b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] > b[sortBy] ? 1 : -1
    }
  })

  // Add the first row back at the beginning
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

async function submit(rowIndex: number) {
  let isSuccess
  let keyI18N
  /** If create */
  if (rowIndex === 0) {
    isSuccess = await $fetch('/api/settings/material-connection', {
      method: 'post',
      body: {
        materialCode: materialInfo.value[0].value,
        materialName: materialInfo.value[1].value,
        materialGroup: materialInfo.value[2].value.value,
        density: materialInfo.value[3].value,
        ph: materialInfo.value[4].value,
        source: materialInfo.value[5].value,
        cost: materialInfo.value[6].value,
        connectedDisps: materialInfo.value[7].value,
        directTransfer: materialInfo.value[8].value,
        rerequestable: materialInfo.value[9].value,
      },
    })
    keyI18N = 'warnings.createResponse'
    expandedRow.value = null
  }
  if (rowIndex) { /** If it is put */
    isSuccess = await $fetch('/api/settings/material-connection', {
      method: 'put',
      body: {
        materialCode: materialInfo.value[0].value,
        materialName: materialInfo.value[1].value,
        materialGroup: materialInfo.value[2].value.value,
        density: materialInfo.value[3].value,
        ph: materialInfo.value[4].value,
        source: materialInfo.value[5].value,
        cost: materialInfo.value[6].value,
        connectedDisps: materialInfo.value[7].value,
        directTransfer: materialInfo.value[8].value,
        rerequestable: materialInfo.value[9].value,
      },
    })
    keyI18N = 'warnings.changeResponse'
  }
  notification(isSuccess, t(keyI18N!, { type: t('warnings.material'), result: isSuccess ? t('warnings.success') : t('warnings.fail') }))
  await getRows()
}
const cancelDialogVisible = ref(false)
async function deleteRow() {
  const isSuccess = await $fetch('/api/settings/material', {
    method: 'delete',
    body: {
      materialCode: materialInfo.value[0].value,
    },
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
</script>

<template>
  <FilterableTable
    :rows="rows"
    :columns="columns"
    :is-expandable="true"
    style="height: 90vh;"
    :custom-sort-method="customSortMethod"
  >
    <template #custombody="props">
      <q-tr :props="props">
        <q-td
          class="cursor-pointer"
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          @click="toggleRow(props.row, props.rowIndex)"
        >
          <q-btn
            v-if="props.row.materialCode || props.rowIndex !== 0"
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
          @click="toggleRow(props.row, props.rowIndex)"
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
          <div class="flex justify-center pt-5">
            <div
              v-for="mate in materialInfo"
              :key="mate.label"
              class="flex ml-5 mt-1"
            >
              <div class="flex class-w-70 pl-2 m-1 items-center">
                {{ mate.label }}
              </div>
              <div class=" flex class-w-100 pl-2 m-1 items-center">
                <span v-if="mate.field === 'materialGroup'">
                  <q-select
                    v-model="mate.value"
                    borderless
                    dense
                    filled
                    class="class-w-70"
                    options-dense
                    :options="materialGroups"
                    option-value="value"
                    option-label="label"
                    style="min-width: 150px"
                  />
                </span>
                <span v-else-if="mate.field === 'connectedDisps'">
                  <q-select
                    v-model="mate.value"
                    borderless
                    multiple
                    dense
                    filled
                    class="class-w-70 overflow-hidden"
                    options-dense
                    :options="disps"
                    option-value="dispNo"
                    option-label="name"
                    style="min-width: 150px"
                  />
                  <!-- :display-value=" mate.value && mate.value.length > 1 ? `${mate.value[0]?.name} + ${mate.value?.length - 1} ${t('more')}` : mate.value[0]?.name" -->
                </span>
                <span v-else-if="mate.field === 'directTransfer' || mate.field === 'rerequestable'">
                  <q-checkbox v-model="mate.value" />
                </span>
                <span v-else>
                  <q-input
                    v-model="mate.value"
                    dense
                    class="class-w-70"
                    filled
                    :type="mate.numeric ? 'number' : 'text'"
                    :placeholder="mate.value"
                    :disable="props.row.materialCode !== undefined && mate.field === 'materialCode'"
                  />

                </span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-5 py-10 w-full">
              <q-btn
                color="black"
                :label="props.rowIndex ? t('settings.submit') : t('settings.new')"
                outline
                :disable="materialInfo[0].value === undefined || materialInfo[0].value === ''"
                icon="done"
                @click="submit(props.rowIndex)"
              />
              <q-btn
                color="black"
                :label="t('settings.cancel')"
                icon="close"
                outline
                @click="toggleRow(props.row, props.rowIndex)"
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
</template>

<style scoped>
.class-w-70 {
  width: 18rem;
}
.class-w-100 {
  width: 20rem;
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
