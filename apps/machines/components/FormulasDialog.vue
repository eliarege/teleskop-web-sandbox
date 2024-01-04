<script setup lang="ts">
import type { Column } from 'ui/types/FilterableTable'
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selectedMachines: Machine[]
}>()

const emit = defineEmits(['close'])

const machineId = computed(() => props.selectedMachines[0].id)

const { data: formulas } = useLazyFetch('/api/machines/formulas', {
  query: { machineId: machineId.value },
  default: () => [],
  method: 'POST',
  body: {},
})

const columns: Column[] = [
  {
    name: 'formulaId',
    label: 'Formül No',
    field: 'formulaId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'formulaName',
    label: 'Formül İsmi',
    field: 'formulaName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'formula',
    label: 'Formül',
    field: 'formula',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'commandName',
    label: 'Komut İsmi',
    field: 'commandName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'parameterName',
    label: 'Parametre İsmi',
    field: 'parameterName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

async function handleFilterSlotsUpdate(updatedValue) {
  formulas.value = await $fetch('/api/machines/formulas', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section>
        <FilterableTable
          :rows="formulas"
          :columns="columns"
          @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
