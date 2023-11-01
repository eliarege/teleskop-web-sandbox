<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { filtersToKnex, navigateToPage, textAlignOverride } from '../shared/functions'
import { rows } from '../shared/constants'
import type { Column } from '~/shared/types'

const { t } = useI18n()

const joborderInput = ref()
const date = ref({ from: '', to: '' })

const selectedMachine = ref()
const machines = await $fetch('/api/machine/machines') // FIXME: useFetc better $fetch may cause page to fail
const joborders = ref()
const jobordersTemp = await $fetch('/api/joborder/joborders')
joborders.value = jobordersTemp

const columns: Array<Column> = [
  { name: 'joborder', label: t('joborder'), field: 'joborder', filterable: true, filterType: 'comparison' },
  { name: 'correctionNo', label: t('correctionNo'), field: 'correctionNo', filterable: true, filterType: 'comparison' },
  { name: 'plannedMachineName', label: t('plannedMachine'), field: 'plannedMachineName', filterable: true, filterType: 'select', selectionOptions: machines, optionLabel: 'machinename', optionValue: 'machineid' },
  { name: 'programList', label: t('registeredJobOrders.programList'), field: 'programList' },
  { name: 'plannedStartTime', label: t('registeredJobOrders.scheduledStartTime'), field: 'plannedStartTime', filterable: true, filterType: 'date' },
]
const noFilterSpec = ref(true)

async function request() {
  let query = '/api/joborder/filtered-joborders?'
  if (selectedMachine.value?.machineid)
    query += `machineid=${selectedMachine.value.machineid}&`
  if (joborderInput.value)
    query += `joborder=${joborderInput.value}&`
  if (date.value.from && date.value.to)
    query += `startdate=${date.value.from}&enddate=${date.value.to}&`
  const tempMachines = await $fetch(query)
  joborders.value = tempMachines
}

async function handleRowDblClick(row) {
  await navigateToPage(`recete-tartim?joborder=${row.joborder}&correctionNo=${row.correctionNo}`)
}

const externalFilterSlots = ref([])
function handleFilterSlotsUpdate(updatedValue) {
  externalFilterSlots.value = updatedValue
  filtersToKnex(externalFilterSlots.value, null)
}
</script>

<template>
  <div class="flex flex-col gap-5 e-border">
    <!-- <div class="ml-5">
      <div class="flex flex-row items-center gap-5">
        {{ t('joborderNo') }}:
        <q-input v-model="joborderInput" clearable />
        <q-btn :label="t('request')" @click="request()" />
        <span v-if="noFilterSpec" style="font-size: small; color: blue;">
          ( {{ t('warnings.noFilterSpec') }} )
        </span>
      </div>
      <div class="flex flex-row gap-5 mt-5 items-center">
        {{ t('machinename') }}:
        <q-select
          v-model="selectedMachine"
          class="w-50"
          :label="t('allMachines')"
          filled
          clearable
          option-label="machinename"
          :options="machines"
        />
        <div class="gap-0 flex flex-row items-center justify-center">
          <q-input
            v-model="date.from"
            filled
            mask="date"
            :label="t('starttime')"
            stack-label
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="date"
                    range
                    minimal
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        label="Close"
                        color="primary"
                        flat
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="date.to"
            filled
            mask="date"
            :label="t('endtime')"
            stack-label
          />
        </div>
        <span v-if="noFilterSpec" style="font-size: small; color: blue;">
          ( {{ t('warnings.noDateSpec') }} )
        </span>
      </div>
    </div> -->
    <span class="header-class">
      {{ t('joborders') }}
    </span>
    <FilterableTable
      :rows="joborders"
      :columns="columns"
      :pagination="{ rowsPerPage: 8 }"
      @row-dblclick="row => handleRowDblClick(row)"
      @update-filter-slots="(evt) => handleFilterSlotsUpdate(evt)"
    >
      <!-- <template #custombody="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.value }}
          </q-td>
        </q-tr>
      </template> -->
    </FilterableTable>
    <div class="footer-buttons">
      <span class="absolute flex left-15">
        ( {{ t('warnings.doubleClickToShowRecipe') }} )
      </span>
    </div>
  </div>
</template>

<style scoped>
.header-class {
  background-color: gray;
  color: white;
  font-size: large;
  width: 100%;
  padding-left: 1%;
}

.text-override-right :deep(.text-right){
  text-align: right;
  word-break: normal;
  white-space: normal;
}
.text-override-center :deep(.text-right){
  text-align: center;
  word-break: normal;
  white-space: normal;
}
.text-override-left :deep(.text-right){
  text-align: left;
  word-break: normal;
  white-space: normal;
}

.footer-buttons {
  font-size: medium;
  color: blue;
  background-color: rgb(236, 236, 236);
  height: 10vh;
  width: 100vw;
  position: absolute;
  bottom: 0px;
  right: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
