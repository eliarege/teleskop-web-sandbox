<script setup lang="ts">
import { klona } from 'klona'
import type { Formula } from '~/types'

const { t } = useI18n()
const route = useRoute()

const machineId = computed(() => route.params.machineId)
const formula = ref<Partial<Formula>>({})
const selectedCommandNo = ref()
const copy = ref()

const { data: formulas, refresh: refreshFormulas } = useLazyFetch('/api/formulas/formulas', {
  query: { machineId: machineId.value },
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: commandOptions } = useLazyFetch('/api/formulas/command-options', {
  method: 'GET',
  default: () => [],
  query: {
    machineId,
  },
  transform: (commandOptions) => {
    commandOptions.unshift({ label: 'Genel Formül', value: 0 })
    commandOptions.map(option => ({ label: option.name, value: option.commandNo }))
    return commandOptions
  },
})

const { data: commandParameterOptions } = useLazyFetch('/api/formulas/command-parameters', {
  immediate: false,
  method: 'GET',
  default: () => [],
  query: {
    machineId,
    commandNo: selectedCommandNo,
  },
})

const columns = computed(() => ([
  {
    name: 'formulaId',
    label: t('formulaId'),
    field: 'formulaId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  {
    name: 'formulaName',
    label: t('formulaName'),
    field: 'formulaName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  {
    name: 'formula',
    label: t('formula'),
    field: 'formula',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    visible: true,
    editable: false,
  },
  {
    name: 'commandName',
    label: t('commandName'),
    field: 'commandName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    // format: (val, row) => commandOptions.value.find(d => d.value === val.value)?.label || val,
    schema: {
      validation: 'required',
      options: commandOptions.value,
    },
  },
  {
    name: 'parameterName',
    label: t('parameterName'),
    field: 'parameterName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    // format: (val, row) => commandParameterOptions.value.find(d => d.value === val)?.label || val,
    schema: {
      options: commandParameterOptions.value,
    },
  },

]))

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
  }
}

const showAddFormulaDialog = ref(false)
</script>

<template>
  <q-card>
    <q-card-section>
      <div>
        <q-input
          v-model="formula.formulaId"
          :label="t('formulaId')"
        />
        <q-input
          v-model="formula.formulaName"
          :label="t('formulaName')"
        />
        <q-select
          :model-value="formula?.commandNo"
          :options="commandOptions"
          option-label="label"
          option-value="value"
          :display-value="formula?.commandName"
          @update:model-value="(e) => handleCommandSelect(e)"
        />
        <q-select
          :model-value="formula?.parameterIndex"
          :options="commandParameterOptions"
          option-label="paramString"
          option-value="parameterIndex"
          :display-value="formula?.parameterName"
          @update:model-value="(e) => handleParamSelect(e)"
        />
      </div>
      <q-btn-group push class="my-4 ml-4">
        <q-btn push :label="t('add')" color="primary" @click="handleAdd" />
        <q-btn push :label="t('edit')" color="primary" @click="handleEdit" />
        <q-btn push :label="t('delete')" color="primary" @click="handleDelete" />
      </q-btn-group>

      <div class="flex w-full justify-end my-4">
        <q-btn no-caps push :label="t('addFormula')" color="primary" @click="showAddFormulaDialog = true" />
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
  />
</template>

<style scoped>
.selected-row {
  background-color: #cce8ff;
}
</style>
