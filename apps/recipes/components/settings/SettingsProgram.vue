<script setup lang="ts">
import type { QTableProps } from 'quasar'
import ProgramHeaderDialog from '../program/ProgramHeaderDialog.vue'
import type { Machine, ProgramHeader } from '~/shared/types'
import { useStateStore } from '~/store/State'

const q = useQuasar()
const { t } = useI18n()
const stateStore = useStateStore()
const { notifySuccess, notifyFail } = useNotify()
const filters = ref([])
const options = [{ programType: 0, name: t('programTypes.0') }, { programType: 1, name: t('programTypes.1') }, { programType: 2, name: t('programTypes.2') }, { programType: 3, name: t('programTypes.3') }, { programType: 4, name: t('programTypes.4') }, { programType: 5, name: t('programTypes.5') }, { programType: 6, name: t('programTypes.6') }, { programType: 7, name: t('programTypes.7') }]
const { data: programs, refresh: refreshPrograms } = await useFetch<ProgramHeader[]>('/api/programs/headers/filtered', { method: 'POST', body: { filters: filters.value, machineId: stateStore.defaultMachine } })
const { data: machines } = await useFetch<Machine[]>('/api/machines')
const columns = ref([
  {
    name: 'programNo',
    label: t('programFields.ID'),
    field: 'programNo',
    align: 'left',
    filterable: true,
    filterType: 'comparison',
  },
  {
    name: 'programName',
    label: t('programFields.Name'),
    field: 'programName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'programType',
    label: t('programFields.Type'),
    field: 'programType',
    align: 'left',
    filterable: true,
    filterType: 'select',
    selectionOptions: options,
    optionLabel: 'name',
    optionValue: 'programType',
  },
])
const showMachineSelection = ref(false)
const currentMachine = ref(stateStore.defaultMachine)
const defaultMachineName = computed(() => {
  const machine = machines.value?.find(m => m.machineId === stateStore.defaultMachine)
  return machine ? machine.machineName : t('DefaultMachine')
})

async function onRowClick(program: ProgramHeader) {
  q.dialog({
    component: ProgramHeaderDialog,
    componentProps: {
      program,
      machines,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshPrograms()
    } else
      notifyFail(t('Failed'))
  },
  )
}

function addNewProgram() {
  q.dialog({
    component: ProgramHeaderDialog,
    componentProps: {
      machines,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshPrograms()
    } else
      notifyFail(t('Failed'))
  },
  )
}

function toggleMachineSelection() {
  showMachineSelection.value = !showMachineSelection.value
}
function hideMachineSelection() {
  showMachineSelection.value = false
}
function onMachineSelected(value) {
  if (value !== currentMachine.value) {
    currentMachine.value = value
    showMachineSelection.value = false
    handleFilterSlotsUpdate(filters.value)
  }
}

async function handleFilterSlotsUpdate(updatedFilters: any) {
  filters.value = updatedFilters
  programs.value = await $fetch('/api/programs/headers/filtered', { method: 'POST', body: { filters: filters.value, machineId: stateStore.defaultMachine } })
}

const pagination = ref({ rowsPerPage: 50 } as QTableProps['pagination'])
</script>

<template>
  <div class="flex-center text-xl pt-5 pl-5">
    {{ t('Programs') }}
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <div class="flex-center mb-4">
    <QBtn
      :label="$t('AddNewProgram')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12 mr-2"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="addNewProgram"
    />
    <TeleskopSyncBtn
      class="ml-2"
      type="Programs"
      :min-size="800"
      @click="refreshPrograms"
    />

    <div class="ml-2" style="min-width: 200px;">
      <QBtn
        v-if="!showMachineSelection"
        :label="defaultMachineName"
        no-caps
        icon="computer"
        color="primary"
        class="h-12"
        style="white-space: nowrap; text-overflow: ellipsis;"
        clickable
        @click="toggleMachineSelection"
      />

      <div v-else class="bg-primary rounded-md p-2">
        <div class="flex justify-between items-center mb-1">
          <h4 class="text-white m-0">
            {{ t('DefaultMachine') }}
          </h4>
          <QBtn
            icon="close"
            flat
            round
            dense
            color="white"
            @click="hideMachineSelection"
          />
        </div>
        <QSelect
          v-model="stateStore.defaultMachine"
          borderless
          dense
          filled
          map-options
          emit-value
          options-dense
          option-label="machineName"
          option-value="machineId"
          :options="machines"
          @update:model-value="onMachineSelected"
        />
      </div>
    </div>
  </div>
  <FilterableTable
    :pagination
    :rows="programs"
    :columns
    class="h-160 custom-filterable-table"
    :is-virtual-scroll="false"
    @update-filter-slots="handleFilterSlotsUpdate"
  >
    <template #custombody="props">
      <QTr
        :props="props"
        style="cursor: pointer;"
        @click="onRowClick(props.row)"
      >
        <QTd
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          <span v-if="col.field === 'programType'">
            {{ options.find((option) => option.programType === props.row[col.field])?.name }}
          </span>
          <span v-else>
            {{ props.row[col.field] }}
          </span>
        </QTd>
      </QTr>
    </template>
  </FilterableTable>
</template>
