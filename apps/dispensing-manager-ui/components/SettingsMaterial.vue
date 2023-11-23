<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Column } from '~/shared/types'

const { t } = useI18n()
const rows = ref([])

await getRows()

const columns: Array<Column> = [
  {
    name: 'materialName',
    label: t('settings.materialName'),
    field: 'materialName',
    filterable: true,
  },
  {
    name: 'materialCode',
    label: t('settings.machinename'),
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

const materialInfo = ref<{ label: string; value: any; field: string }[]>([
  { label: t('settings.materialCode'), value: '', field: 'materialCode' },
  { label: t('settings.materialName'), value: '', field: 'materialName' },
  { label: t('settings.materialType'), value: '', field: 'materialGroup' },
  { label: t('settings.materialDensity'), value: '', field: 'density' },
  { label: 'pH', value: '', field: 'ph' },
  { label: t('settings.supplySource'), value: '', field: 'source' },
  { label: t('settings.materialKgPrice'), value: '', field: 'cost' },
  { label: t('settings.rerequestable'), value: '', field: 'rerequestable' },
  { label: t('settings.directlyTransfer'), value: '', field: 'directTransfer' },

])

async function getRows() {
  rows.value = await $fetch('/api/setting/material')
  rows.value.unshift({})
}

function resetMaterialInfo(row?: any) {
  if (!row)
    materialInfo.value.forEach(mate => mate.value = '')
  else {
    materialInfo.value.forEach((mate) => {
      if (mate.field === 'controlDevice') {
        controlDevices.forEach(dev => dev.value === row[mate.field] ? mate.value = dev : '')
      } else if (mate.field === 'connectedDisps') {
        mate.value = row.disps
        console.log(mate.value)
      } else {
        mate.value = row[mate.field]
      }
    })
  }
}

const expandedRow = ref()

function toggleRow(row: any, index: number) {
  expandedRow.value === index
    ? expandedRow.value = null
    : expandedRow.value = index
  resetMaterialInfo(row)
  console.log(materialInfo.value)
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

async function submit(rowIndex: number) {
  /** If create */
  if (rowIndex === 0) {
    // await $fetch('/api/setting/create-machine-dispenser-connection', {
    //   method: 'post',
    //   body: {
    //     machineid: materialInfo.value[0].value,
    //     machinename: materialInfo.value[1].value,
    //     controlDevice: materialInfo.value[2].value.value,
    //     disps: materialInfo.value[3].value,
    //   },
    // })
  }
  if (rowIndex) { /** If it is put */
    console.log(materialInfo.value)
    // await $fetch('/api/setting/update-machine-dispenser-connection', {
    //   method: 'put',
    //   body: {
    //     machineid: materialInfo.value[0].value,
    //     machinename: materialInfo.value[1].value,
    //     controlDevice: materialInfo.value[2].value.value,
    //     disps: materialInfo.value[3].value,
    //   },
    // })
  }
  await getRows()
}
</script>

<template>
  <FilterableTable
    :rows="rows"
    :columns="columns"
    :is-expandable="true"
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
            style="background-color: rgb(80, 158, 227); color: white;"
            round
            dense
            :icon="props.rowIndex === expandedRow ? 'expand_less' : 'expand_more'"
          />
          <q-btn
            v-else
            outline
            style="color: rgb(80, 158, 227); font-weight: bold; font-size: larger; "
            :label="t('settings.new')"
            class=""
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
          <span>
            {{ col.value }}
          </span>
        </q-td>
      </q-tr>

      <q-tr v-if="props.rowIndex === expandedRow" :props="props">
        <q-td colspan="100%">
          <div class=" flex">
            <div class="">
              <div
                v-for="mate in materialInfo"
                :key="mate.label"
                class="flex ml-5 mt-1"
              >
                <div class="flex w-70 pl-2 m-1 items-center">
                  {{ mate.label }}
                </div>
                <div class=" flex w-100 pl-2 m-1 items-center">
                  <span v-if="mate.field === 'controlDevice'">
                    <q-select
                      v-model="mate.value"
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
                  <span v-else-if="mate.field === 'connectedDisps'">
                    <q-select
                      v-model="mate.value"
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
                    <!-- :display-value=" mate.value && mate.value.length > 1 ? `${mate.value[0]?.name} + ${mate.value?.length - 1} ${t('more')}` : mate.value[0]?.name" -->
                  </span>
                  <span v-else>
                    <q-input
                      v-model="mate.value"
                      dense
                      class="w-70"
                      filled
                      :type="mate.field === 'machineid' ? 'number' : 'text'"
                      :placeholder="mate.value"
                      :disable="props.row.machineid > 0 && mate.field === 'machineid'"
                    />

                  </span>
                </div>
              </div>

              <div class="flex items-center justify-center gap-5 py-10">
                <q-btn
                  color="primary"
                  :label="t('settings.submit')"
                  outline
                  :disable="materialInfo[0].value === undefined || materialInfo[0].value === ''"
                  icon="done"
                  @click="submit(props.rowIndex)"
                />
                <q-btn
                  color="primary"
                  :label="t('settings.cancel')"
                  icon="close"
                  outline
                  @click="toggleRow(props.row, props.rowIndex)"
                />
              </div>
            </div>
          </div>
        </q-td>
      </q-tr>
    </template>
  </FilterableTable>
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
