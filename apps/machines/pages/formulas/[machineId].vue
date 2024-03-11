<script setup lang="ts">
import { klona } from 'klona'
import type { Formula } from '~/types'

const { t } = useI18n()
const route = useRoute()

const columns = computed(() => ([
  {
    name: 'formulaId',
    label: t('formulaId'),
    field: 'formulaId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'formulaName',
    label: t('formulaName'),
    field: 'formulaName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'formula',
    label: t('formula'),
    field: 'formula',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'commandName',
    label: t('commandName'),
    field: 'commandName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'parameterName',
    label: t('parameterName'),
    field: 'parameterName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

]))

const machineId = computed(() => route.params.machineId)
const formula = ref<Partial<Formula>>({})
const selectedCommandNo = ref()
const copy = ref()

const { data: formulas, refresh: refreshFormulas } = useLazyFetch('/api/formulas/formulas', {
  query: { machineId: machineId.value },
  default: () => [],
  method: 'POST',
  body: {},
  transform: (formulas) => {
    return formulas.map((formula) => {
      return {
        ...formula,
        commandName: formula.commandName ?? t('generalFormula'),
        parameterName: formula.parameterName ?? t('generalParameter'),
      }
    })
  },
})

const { data: commandOptions } = useLazyFetch('/api/formulas/command-options', {
  method: 'GET',
  default: () => [],
  query: {
    machineId,
  },
  transform: (commandOptions) => {
    const arr = commandOptions.map(option => ({ label: option.commandName, value: option.commandNo }))
    arr.unshift({ label: t('generalFormula'), value: 0 })
    return arr
  },
})

const { data: commandParameterOptions, execute: executeCommandParameterOptions } = useLazyFetch('/api/formulas/command-parameters', {
  immediate: false,
  method: 'GET',
  default: () => [],
  query: {
    machineId,
    commandNo: selectedCommandNo,
  },
  transform: (commandParameterOptions) => {
    const arr = commandParameterOptions.map(option => ({ label: option.paramString, value: option.parameterIndex }))
    arr.unshift({ label: t('generalParameter'), value: 0 })
    return arr
  },
})

async function handleAdd() {
  await $fetch('/api/formulas/formula', {
    method: 'POST',
    body: {
      ...formula.value,
      machineId: machineId.value,
    },
  })
  await refreshFormulas()
}

async function handleEdit() {
  await $fetch('/api/formulas/formula', {
    method: 'PUT',
    body: {
      formula: formula.value,
      machineId: machineId.value,
      oldFormulaId: copy.value.formulaId,
    },
  })
  await refreshFormulas()
}

async function handleDelete() {
  await $fetch('/api/formulas/formula', {
    method: 'DELETE',
    query: {
      formulaId: formula.value.formulaId,
      machineId: machineId.value,
    },
  })
  await refreshFormulas()
}
function handleCommandSelect(e: { value: number, label: string }) {
  selectedCommandNo.value = e.value
  formula.value.commandNo = e.value
  formula.value.commandName = e.label
}

function handleParamSelect(e: { value: number, label: string }) {
  formula.value.parameterIndex = e.value
  formula.value.parameterName = e.label
}

async function handleFilterSlotsUpdate(updatedValue) {
  formulas.value = await $fetch('/api/formulas/formulas', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
async function handleFormulaSelection(obj: Formula) {
  if (formula.value.formulaId === obj.formulaId) {
    formula.value = {
      formulaId: -1,
    }
  } else {
    formula.value = obj
    copy.value = klona(obj)
    selectedCommandNo.value = obj.commandNo
    await executeCommandParameterOptions()
  }
}

const showAddFormulaDialog = ref(false)
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="w-full flex flex-row justify-around my-4">
        <q-input
          v-model="formula.formulaId"
          filled
          :label="t('formulaId')"
          class="w-1/6"
        />
        <q-input
          v-model="formula.formulaName"
          filled
          :label="t('formulaName')"
          class="w-1/6"
        />
        <q-select
          :model-value="formula?.commandNo"
          :options="commandOptions"
          :label="t('commands')"
          filled
          option-label="label"
          option-value="value"
          :display-value="formula?.commandName"
          class="w-1/6"
          @update:model-value="(e) => handleCommandSelect(e)"
        />
        <q-select
          :model-value="formula?.parameterIndex"
          :options="commandParameterOptions"
          :label="t('commandParameters')"
          filled
          option-label="label"
          option-value="value"
          :display-value="formula?.parameterName"
          class="w-1/6"
          @update:model-value="(e) => handleParamSelect(e)"
        />
      </div>
      <div class="flex w-full justify-between m-4">
        <q-btn-group push>
          <q-btn push :label="t('add')" @click="handleAdd" />
          <q-btn push :label="t('edit')" @click="handleEdit" />
          <q-btn push :label="t('delete')" @click="handleDelete" />
        </q-btn-group>
        <q-btn no-caps push :label="t('addFormula')" @click="showAddFormulaDialog = true" />
      </div>
      <FilterableTable
        :rows="formulas"
        :columns="columns"
        class="overflow-y-auto	h-160"
        @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
      >
        <template #custombody="formulas">
          <q-tr
            :class="{ 'selected-row': formula.formulaId === formulas.row.formulaId }"
            @click="handleFormulaSelection(formulas.row)"
          >
            <q-td
              v-for="row in formulas.cols"
              :key="row"
            >
              <span>
                {{ row.value }}
              </span>
            </q-td>
          </q-tr>
        </template>
      </FilterableTable>
    </q-card-section>
  </q-card>
  <AddFormulaDialog
    v-if="showAddFormulaDialog"
    :show="showAddFormulaDialog"
    :machine-id="machineId"
    :formula="formula"
    @close="showAddFormulaDialog = false"
    @refresh="refreshFormulas"
  />
</template>

<style scoped>
.selected-row {
  background-color: #cce8ff;
}
</style>
