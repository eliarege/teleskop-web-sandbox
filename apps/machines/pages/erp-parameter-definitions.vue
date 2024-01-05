<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { ErpParameter, Machine } from '~/types'

const machineColumns: Column[] = [
  {
    name: 'machineId',
    label: 'Makine Id',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'machineCode',
    label: 'Makine Adı',
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const parameterColumns = [
  {
    name: 'paramId',
    label: 'Parametre Id',
    field: 'paramId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'paramName',
    label: 'Parametre Adı',
    field: 'paramName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const erpMatchingOptions = [{ label: 'Bitir', value: 3 }, { label: 'Atla', value: 4 }, { label: 'Makine Duraklatma', value: 5 }]

const selectedMachine = ref<Machine>({
  machineId: -1,
})

const selectedParam = ref<ErpParameter>({
  paramId: -1,
})

const selectedMachineId = computed(() => selectedMachine.value.machineId)

const { data: machines } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: parameters } = useLazyFetch('/api/erp/erp-parameters', {
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
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-start input-field">
        <q-input
          v-model="selectedParam.paramName"
          label="Parametre İsmi"
          filled
          class="w-xs"
        />
        <q-select
          :options="erpMatchingOptions"
          label="ERP Eşleştirme Alanı"
          filled
          class="w-xs"
        />
      </div>

      <div class="flex flex-row input-field my-8">
        <q-btn
          label="Ekle"
          no-caps
        />
        <q-btn
          label="Düzenle"
          no-caps
        />
        <q-btn
          label="Sil"
          no-caps
        />
      </div>

      <div class="flex flex-row justify-evenly">
        <FilterableTable
          :rows="machines"
          :columns="machineColumns"
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
          :rows="parameters"
          :columns="parameterColumns"
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
