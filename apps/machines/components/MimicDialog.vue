<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const tab = ref('inputs')

const machineId = computed(() => props.selected.machineId)

const { data: inputs } = useLazyFetch('/api/IO/analog-input', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const inputColumns: Column[] = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'name',
    label: 'Giriş/Çıkış Adı',
    field: 'name',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

const { data: outputs } = useLazyFetch('/api/IO/analog-output', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const outputColumns: Column[] = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'name',
    label: 'Giriş/Çıkış Adı',
    field: 'name',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]

async function handleFilterSlotsUpdateInputs(updatedValue) {
  inputs.value = await $fetch('/api/IO/analog-input', {
    method: 'POST',
    body: {
      machineId: machineId.value,
      filters: updatedValue,
    },
  })
}

async function handleFilterSlotsUpdateOutputs(updatedValue) {
  outputs.value = await $fetch('/api/IO/analog-output', {
    method: 'POST',
    body: {
      machineId: machineId.value,
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
        <q-card>
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="inputs" label="Analog Girişler" />
            <q-tab name="outputs" label="Analog Çıkışlar" />
            <q-tab name="other" label="Diğer Ayarlar" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="inputs">
              <FilterableTable
                :rows="inputs"
                :columns="inputColumns"
                @update-filter-slots="evt => handleFilterSlotsUpdateInputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="outputs">
              <FilterableTable
                :rows="outputs"
                :columns="outputColumns"
                @update-filter-slots="evt => handleFilterSlotsUpdateOutputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="other">
              <q-input label="Maksimum Kule Hızı" />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
