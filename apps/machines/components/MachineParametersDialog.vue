<script setup lang="ts">
import type { Machine } from '~/types'
import { addMachine, getMachineGroups } from '~/utils'

const props = defineProps<{
  show: boolean
  selectedMachines: Machine[]
}>()

const emit = defineEmits(['close'])

const columns = [
  {
    name: 'id',
    label: 'Parametre No',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'paramString',
    label: 'İsim',
    field: row => row.paramString,
    align: 'left',
  },
  {
    name: 'paramLowLimit',
    label: 'Alt Limit',
    field: row => row.paramLowLimit,
    align: 'left',
  },

  {
    name: 'paramHighLimit',
    label: 'Üst Limit',
    field: row => row.paramHighLimit,
    align: 'left',
  },

  {
    name: 'defaultValue',
    label: 'Varsayılan Değer',
    field: row => row.defaultValue,
    align: 'left',
  },
  {
    name: 'currentValue',
    label: 'Değer',
    field: row => row.currentValue,
    align: 'left',
  },
]

const id = computed(() => props.selectedMachines.length ? props.selectedMachines[0].id : null)
const { data: rows, pending } = await useFetch('/api/machines/machine-parameters', {
  query: { machineId: id.value },
})
</script>

<template>
  <q-dialog
    :model-value="show"
    full-width
    @hide="$emit('close')"
  >
    <q-card>
      <q-card-section>
        <q-table
          :loading="pending && id"
          :rows="rows"
          :columns="columns"
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
          row-key="reasonId"
          separator="cell"
          bordered
          selection="single"
          table-header-class="table-header"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}
</style>
