<script setup lang="ts">
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import type { BatchParam, ErpParameter, Machine } from '~/types'

const { t } = useI18n()

const machineColumns = computed(() => ([
  {
    name: 'machineId',
    label: t('machineId'),
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCode',
    label: t('machineCode'),
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

const parameterColumns = computed(() => ([
  {
    name: 'paramId',
    label: t('parameterId'),
    field: 'paramId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'paramName',
    label: t('parameterName'),
    field: 'paramName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'erpFieldName',
    label: t('erpFieldName'),
    field: 'erpFieldName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

const paramOptions = [
  'DyelotRefNo',
  'Dyelot',
  'ExternalDyelot',
  'ReDye',
  'Machine',
  'Color',
  'State',
  'ImportState',
  'StartTime',
  'EndTime',
  'OrderNo',
  'Customer',
  'Article',
  'RecipeNo',
  'Text1',
  'Text2',
  'Text3',
  'Text4',
  'Text5',
  'Weight',
  'LiquorRatio',
  'LiquorQuantity',
  'Parameter1',
  'Parameter2',
  'Parameter3',
  'Parameter4',
  'Parameter5',
  'Parameter6',
  'Parameter7',
  'Parameter8',
  'Parameter9',
  'Parameter10',
  'Parameter11',
  'Parameter12',
  'Parameter13',
  'Parameter14',
  'Parameter15',
  'Parameter16',
  'Parameter17',
  'Parameter18',
  'Parameter19',
  'Parameter20',
  'Note1',
  'Note2',
  'Note3',
  'Note4',
  'Note5',
  'RunTime',
  'SetTime',
  'OperatorTime',
  'HoldAlarmTime',
  'StopAlarmTime',
  'ManualTime',
  'CorrectionTime',
  'StopTime',
  'PrepTime',
  'Time1',
  'Time2',
  'Time3',
  'Water1',
  'Water2',
  'Power',
  'HeatingEnergy',
  'CoolingEnergy',
  'Consumption1',
  'Consumption2',
  'AlarmCnt',
  'InterventionCnt',
  'SendTime',
  'Coupling',
  'Slavemachine1',
  'endState',
  'Parameter21',
  'Parameter22',
  'Parameter23',
  'Parameter24',
  'Parameter25',
  'Parameter26',
  'Parameter27',
  'Parameter28',
  'Parameter29',
  'Parameter30',
  'StartingOperator',
  'FinishingOperaor',
  'ColourNo',
  'ColourDescript',
  'ColourGroup',
  'FiberGroup',
  'DyeGroup',
  'DyeType',
  'Parameter31',
  'Parameter32',
  'Parameter33',
  'Parameter34',
  'Parameter35',
  'Parameter36',
  'Parameter37',
  'Parameter38',
  'Parameter39',
  'Parameter40',
  'Parameter41',
  'Parameter42',
  'Parameter43',
  'Parameter44',
  'Parameter45',
  'Parameter46',
  'Parameter47',
  'Parameter48',
  'Parameter49',
  'Parameter50',
  'StartConfirm',
  'EndConfirm',
  'ActualMachine',
  'LastCompletedRequest',
  'ReadyToStart',
  'BlockReason',
  'Steam',
  'TotalWater',
  'Water3',
  'Water4',
  'Water5',
  'Water6',
  'FabricQualityInfo',
  'FabricLotNumber',
  'DyehouseNumber',
  'WITHOUTRECIPE',
  'CreateDate',

]

const selectedMachine = ref<Machine>({
  machineId: -1,
})

const selectedParam = ref<Partial<ErpParameter>>({
  paramId: -1,
})

const showImportBatchParametersDialog = ref(false)

const selectedMachineId = computed(() => selectedMachine.value.machineId)

const { data: machines } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: params, refresh: refreshParams } = useLazyFetch('/api/erp/erp-parameters', {
  default: () => [],
  immediate: false,
  method: 'POST',
  body: { machineId: selectedMachineId },
})

async function handleFilterSlotsUpdate(updatedValue) {
  machines.value = await $fetch('/api/machines/machines', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}

async function handleMachineSelection(obj: Machine) {
  if (selectedMachine.value.machineId === obj.machineId) {
    selectedMachine.value = {
      machineId: -1,
    }
  } else {
    selectedMachine.value = obj
  }
  selectedParam.value = {
    paramId: -1,
  }
}

async function handleParamSelection(obj: ErpParameter) {
  if (selectedParam.value.paramId === obj.paramId) {
    selectedParam.value = {
      paramId: -1,
    }
  } else {
    selectedParam.value = obj
  }
}

async function addParam() {
  if (params.value.length) {
    const paramId = Math.max(...params.value.map(p => p.paramId)) + 1
    await $fetch('/api/erp/erp-parameter', {
      method: 'POST',
      body: { paramId, machineId: selectedMachineId.value, erpParameter: selectedParam.value },
    })
    await refreshParams()
  }
}

async function editParam() {
  await $fetch('/api/erp/erp-parameter', {
    method: 'PUT',
    body: { erpParameter: selectedParam.value },
  })
  await refreshParams()
}

async function deleteParam() {
  return await $fetch('/api/erp/erp-parameter', {
    method: 'DELETE',
    body: { erpParameter: selectedParam.value },
  })
  await refreshParams()
}

async function addBatchParam(batchParam: BatchParam) {
  showImportBatchParametersDialog.value = false
  await $fetch('/api/erp/erp-parameter', {
    method: 'POST',
    body: {
      machineId: selectedMachineId.value,
      paramId: params.value.length ? Math.max(...params.value.map(p => p.paramId)) + 1 : 1,
      erpParameter: {
        paramName: batchParam.paramString,
        erpFieldName: null,
      },
    },
  })
  await refreshParams()
}

enum CopyMode {
  All = 1,
  Startup = 2,
  NonStartup = 3,
}

const copy = ref()
const copyMode = ref<CopyMode>()

const contextMenuOptions = computed(() => [
  {
    label: t('copyAll'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selectedMachineId.value === -1,
    onClick: () => {
      copy.value = selectedMachineId.value
      copyMode.value = 1
    },
  },
  {
    label: t('copyStartupParameters'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selectedMachineId.value === -1,
    onClick: () => {
      copy.value = selectedMachineId.value
      copyMode.value = 2
    },
  },
  {
    label: t('copyNonStartupParameters'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selectedMachineId.value === -1,
    onClick: () => {
      copy.value = selectedMachineId.value
      copyMode.value = 3
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selectedMachineId.value === -1 || !copy.value || !copyMode.value,
    onClick: async () => {
      await $fetch('/api/erp/copy', {
        method: 'POST',
        body: {
          sourceMachineId: copy.value,
          targetMachineId: selectedMachineId.value,
          mode: copyMode.value,
        },
      })
    },
  },
])
</script>

<template>
  <ContextMenu :context-menu-options="contextMenuOptions" @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)" />
  <div>
    <q-card>
      <q-card-section>
        <div class="flex flex-row justify-start input-field">
          <q-input
            v-model="selectedParam.paramName"
            :label="t('parameterName')"
            filled
            class="w-xs"
          />
          <q-select
            v-model="selectedParam.erpFieldName"
            :options="paramOptions"
            :label="t('erpFieldName')"
            filled
            class="w-xs"
          />
        </div>

        <div class="flex flex-row input-field my-8">
          <q-btn
            :label="t('add')"
            no-caps
            @click="addParam"
          />
          <q-btn
            :label="t('edit')"
            no-caps
            :disable="selectedParam.paramId === -1"
            @click="editParam"
          />
          <q-btn
            :label="t('delete')"
            no-caps
            :disable="selectedParam.paramId === -1"
            @click="deleteParam"
          />
        </div>
        <div class="my-4 flex justify-between w-full">
          <q-btn
            no-caps
            :label="t('ImportFromBatchParameters')"
            @click="showImportBatchParametersDialog = true"
          />
        </div>

        <div class="flex flex-row justify-evenly">
          <FilterableTable
            :rows="machines"
            :columns="machineColumns"
            class="overflow-y-auto	h-160 w-xl"
            @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
          >
            <template #custombody="machines">
              <q-tr
                :class="{ 'selected-row': selectedMachine.machineId === machines.row.machineId }"
                @click="handleMachineSelection(machines.row)"
              >
                <q-td
                  v-for="row in machines.cols"
                  :key="row"
                >
                  <span>
                    {{ row.value }}
                  </span>
                </q-td>
              </q-tr>
            </template>
          </FilterableTable>

          <FilterableTable
            :rows="params"
            :columns="parameterColumns"
            class="overflow-y-auto h-160 w-2xl"
          >
            <template #custombody="parameters">
              <q-tr
                :class="{ 'selected-row': selectedParam.paramId === parameters.row.paramId }"
                @click="handleParamSelection(parameters.row)"
              >
                <q-td
                  v-for="row in parameters.cols"
                  :key="row"
                >
                  <span>
                    {{ row.value }}
                  </span>
                </q-td>
              </q-tr>
            </template>
          </FilterableTable>
        </div>
      </q-card-section>
    </q-card>
    <ImportBatchParametersDialog
      v-if="showImportBatchParametersDialog"
      :show="showImportBatchParametersDialog"
      @close="showImportBatchParametersDialog = false"
      @add-batch-param="addBatchParam"
    />
  </div>
</template>

<style scoped>
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.input-field > * {
  margin-right: 2em;
}

.selected-row {
  background-color: #cce8ff;
}
</style>
