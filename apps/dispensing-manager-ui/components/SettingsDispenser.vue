<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Column } from '~/shared/types'
import { colors } from '~/shared/constants'

const { t } = useI18n()
const rows = ref([])
const types = ref([])
const protocols = ref(['7', '15', 'n', 'n-v2', 'n-v3', 'n-v4', 'n-v5', 'EMTS'])

await getRows()
await getTypes()

const columns: Array<Column> = [
  {
    name: 'dispNo',
    label: t('settings.dispSettings.dispNo'),
    field: 'dispNo',
    filterable: true,
  },
  {
    name: 'name',
    label: t('settings.dispSettings.dispName'),
    field: 'name',
    filterable: true,
  },
  {
    name: 'fileSystem',
    label: t('settings.dispSettings.dispFileSystem'),
    field: 'fileSystem',
    filterable: true,
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
  },
]

const dispenserInfo = ref<{ label: string; value: any; field: string; options?: Array<any> }[]>([
  { label: t('settings.dispSettings.dispNo'), value: '', field: 'dispNo' },
  { label: t('settings.dispSettings.dispName'), value: '', field: 'name' },
  { label: t('settings.dispSettings.dispType'), value: '', field: 'dispType' },
  { label: t('settings.dispSettings.dispIP'), value: '', field: 'dispIP' },
  { label: t('settings.dispSettings.dispFileSystem'), value: '', field: 'fileSystem' },
  { label: t('settings.dispSettings.dispFileName'), value: '', field: 'fileName' },
  { label: t('settings.dispSettings.dispProtocol'), value: '', field: 'protocol' },
  { label: t('settings.dispSettings.dispConsumptionFileName'), value: '', field: 'consumptionFile' },
])

async function getTypes() {
  types.value = await $fetch('/api/setting/dispenser-type')
}

async function getRows() {
  rows.value = await $fetch('/api/setting/dispenser')
  rows.value.unshift({})
}

function resetDispenserInfo(row?: any) {
  console.log('Reseting --->>')
  if (!row)
    dispenserInfo.value.forEach(disp => disp.value = '')
  else {
    dispenserInfo.value.forEach((disp) => {
      disp.field === 'dispType'
        ? types.value.forEach((type: { type: number; name: string }) => type.type === row[disp.field] ? disp.value = type : '')
        : disp.value = row[disp.field]
    })
  }
}

const expandedRow = ref()

function toggleRow(row: any, index: number) {
  expandedRow.value === index
    ? expandedRow.value = null
    : expandedRow.value = index
  resetDispenserInfo(row)
}
const dmsRead = ref(false)

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

async function submit(rowIndex: number, row: any) {
  let isOriginNo = true
  /** If create */
  if (rowIndex === 0) {
    const a = await $fetch('/api/setting/dispenser', {
      method: 'post',
      body: {
        dispNo: dispenserInfo.value[0].value,
        name: dispenserInfo.value[1].value,
        dispType: dispenserInfo.value[2].value.type,
        dispIP: dispenserInfo.value[3].value,
        fileSystem: dispenserInfo.value[4].value,
        fileName: dispenserInfo.value[5].value,
        protocol: dispenserInfo.value[6].value,
      },
    })
    console.log(a)
    expandedRow.value = null
  }
  if (rowIndex) { /** If it is put */
    if (row.dispNo !== dispenserInfo.value[0].value) {
      isOriginNo = false
    }
    await $fetch('/api/setting/dispenser', {
      method: 'put',
      body: {
        dispNo: dispenserInfo.value[0].value,
        isOriginNo,
        name: dispenserInfo.value[1].value,
        dispType: dispenserInfo.value[2].value.type,
        dispIP: dispenserInfo.value[3].value,
        fileSystem: dispenserInfo.value[4].value,
        fileName: dispenserInfo.value[5].value,
        protocol: dispenserInfo.value[6].value,
      },
    })
  }
  await getRows()
}
const cancelDialogVisible = ref(false)
async function deleteRow() {
  console.log(dispenserInfo.value)
  await $fetch('/api/setting/dispenser', {
    method: 'delete',
    body: {
      dispNo: dispenserInfo.value[0].value,
    },
  })
  expandedRow.value = null
  /**
   * I did not reset the dispenserInfo array careful. It has to be
   * set before use so it will not be a problem but in case
   * to relocate buttons on top of the screen can be example where we boomed
   */
  await getRows()
}
</script>

<template>
  <FilterableTable
    :rows="rows"
    :columns="columns"
    :is-expandable="true"
    style="height: 85vh;"
    :custom-sort-method="customSortMethod"
  >
    <template #custombody="props">
      <q-tr :props="props">
        <q-td
          :style="props.rowIndex % 2 ? `background-color: ${colors.tableGray}` : '' "
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex)"
        >
          <q-btn
            v-if="props.row.dispNo"
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
          @click="toggleRow(props.row, props.rowIndex)"
        >
          {{ col.value }}
        </q-td>
      </q-tr>

      <q-tr v-if="props.rowIndex === expandedRow" :props="props">
        <q-td colspan="100%">
          <div class="flex justify-center pt-5">
            <div
              v-for="disp in dispenserInfo"
              :key="disp.label"
              class="flex flex-row ml-5 mt-1"
            >
              <div class="flex w-70 pl-2 m-1 items-center">
                {{ disp.label }}
              </div>
              <div class=" flex w-100 pl-2 m-1 items-center">
                <span v-if="disp.field === 'protocol'">
                  <q-select
                    v-model="disp.value"
                    borderless
                    dense
                    class="w-70"
                    filled
                    options-dense
                    :options="protocols"
                    style="min-width: 150px"
                  />
                </span>
                <span v-else-if="disp.field === 'dispType'">
                  <q-select
                    v-model="disp.value"
                    borderless
                    dense
                    filled
                    class="w-70"
                    options-dense
                    :options="types"
                    option-value="type"
                    option-label="name"
                    style="min-width: 150px"
                  />
                </span>
                <span v-else>
                  <q-input
                    v-model="disp.value"
                    class="w-70"
                    dense
                    :type="disp.field === 'dispNo' ? 'number' : 'text'"
                    filled
                    :placeholder="disp.value"
                    :disable="disp.field === 'dispNo' && props.row.dispNo > 0"
                  />
                </span>
                <span v-if="disp.field === 'consumptionFile'">
                  <q-checkbox v-model="dmsRead" :label="t('settings.dispSettings.readFromDMS')" />
                </span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-5 py-10 w-full">
              <q-btn
                color="black"
                :label="props.rowIndex ? t('settings.submit') : t('settings.new')"
                :disable="dispenserInfo[0].value === undefined || dispenserInfo[0].value === ''"
                outline
                icon="done"
                @click="submit(props.rowIndex, props.row)"
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
.setting-section-header {
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
