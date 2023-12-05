<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Column } from '~/shared/types'
import { colors } from '~/shared/constants'

const { t } = useI18n()
const rows = ref([])
const disps = ref([])

await getRows()
await getDisps()

const columns: Array<Column> = [
  {
    name: 'machineid',
    label: t('settings.machineCode'),
    field: 'machineid',
    filterable: true,
  },
  {
    name: 'machinename',
    label: t('settings.machinename'),
    field: 'machinename',
    filterable: true,
  },
  {
    name: 'controlDevice',
    label: t('settings.controlMach'),
    field: 'controlDevice',
    filterable: true,
  },
]

const controlDevices = [
  { value: 0, label: 'Programatörü Yok' },
  { value: 1, label: 'Eliar' },
  { value: 2, label: 'Sedo' },
  { value: 3, label: 'Setrex' },
  { value: 4, label: 'Termo' },
  { value: 5, label: 'Tonello' },
]

const machineInfo = ref<{ label: string; value: any; field: string }[]>([
  { label: t('settings.machineCode'), value: '', field: 'machineid' },
  { label: t('settings.machinename'), value: '', field: 'machinename' },
  { label: t('settings.controlMach'), value: '', field: 'controlDevice' },
  { label: t('settings.connectedDisps'), value: '', field: 'connectedDisps' },

])

async function getRows() {
  rows.value = await $fetch('/api/setting/machine-dispenser-connection')
  rows.value.unshift({})
}

async function getDisps() {
  disps.value = await $fetch('/api/setting/dispenser')
}

function resetMachineInfo(row?: any) {
  if (!row)
    machineInfo.value.forEach(mach => mach.value = '')
  else {
    machineInfo.value.forEach((mach) => {
      if (mach.field === 'controlDevice') {
        controlDevices.forEach(dev => dev.value === row[mach.field] ? mach.value = dev : '')
      } else if (mach.field === 'connectedDisps') {
        mach.value = row.disps
        console.log(mach.value)
      } else {
        mach.value = row[mach.field]
      }
    })
  }
}

const expandedRow = ref()

function toggleRow(row: any, index: number) {
  expandedRow.value === index
    ? expandedRow.value = null
    : expandedRow.value = index
  resetMachineInfo(row)
  console.log(machineInfo.value)
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

async function submit(rowIndex: number) {
  /** If create */
  if (rowIndex === 0) {
    await $fetch('/api/setting/create-machine-dispenser-connection', {
      method: 'post',
      body: {
        machineid: machineInfo.value[0].value,
        machinename: machineInfo.value[1].value,
        controlDevice: machineInfo.value[2].value.value,
        disps: machineInfo.value[3].value,
      },
    })
  }
  if (rowIndex) { /** If it is put */
    console.log(machineInfo.value)
    await $fetch('/api/setting/update-machine-dispenser-connection', {
      method: 'put',
      body: {
        machineid: machineInfo.value[0].value,
        machinename: machineInfo.value[1].value,
        controlDevice: machineInfo.value[2].value.value,
        disps: machineInfo.value[3].value,
      },
    })
  }
  await getRows()
}

const cancelDialogVisible = ref(false)
async function deleteRow() {
  await $fetch('/api/setting/delete-machine-dispenser-connection', {
    method: 'delete',
    body: {
      machineid: machineInfo.value[0].value,
      disps: machineInfo.value[3].value,
    },
  })
  expandedRow.value = null
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
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex)"
        >
          <q-btn
            v-if="props.rowIndex"
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
          class="cursor-pointer"
          @click="toggleRow(props.row, props.rowIndex)"
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
          <div class="flex justify-center pt-5">
            <div
              v-for="mach in machineInfo"
              :key="mach.label"
              class="flex ml-5 mt-1"
            >
              <div class="flex w-70 pl-2 m-1 items-center">
                {{ mach.label }}
              </div>
              <div class=" flex w-100 pl-2 m-1 items-center">
                <span v-if="mach.field === 'controlDevice'">
                  <q-select
                    v-model="mach.value"
                    borderless
                    dense
                    filled
                    class="w-70"
                    options-dense
                    :options="controlDevices"
                    option-value="value"
                    option-label="label"
                    style="min-width: 150px"
                  />
                </span>
                <span v-else-if="mach.field === 'connectedDisps'">
                  <q-select
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
                  />
                  <!-- :display-value=" mach.value && mach.value.length > 1 ? `${mach.value[0]?.name} + ${mach.value?.length - 1} ${t('more')}` : mach.value[0]?.name" -->
                </span>
                <span v-else>
                  <q-input
                    v-model="mach.value"
                    dense
                    class="w-70"
                    filled
                    :type="mach.field === 'machineid' ? 'number' : 'text'"
                    :placeholder="mach.value"
                    :disable="props.row.machineid > 0 && mach.field === 'machineid'"
                  />

                </span>
              </div>
            </div>

            <div class="flex items-center justify-center gap-5 py-10">
              <q-btn
                color="black"
                :label="props.rowIndex ? t('settings.submit') : t('settings.new')"
                outline
                :disable="machineInfo[0].value === undefined || machineInfo[0].value === ''"
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
