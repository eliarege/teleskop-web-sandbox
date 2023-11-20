<script setup lang="ts">
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selectedMachines: Machine[]
}>()

const emit = defineEmits(['close'])

const tab = ref('inputs')

const machineId = computed(() => props.selectedMachines[0].id)

const { data: inputs, pending: inputPending } = await useFetch('/api/IO/analog-input', {
  query: { machineId: machineId.value },
})

const inputColumns = [
  {
    name: 'id',
    label: 'ID',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'name',
    label: 'Giriş/Çıkış Adı',
    field: row => row.name,
    align: 'left',
  },
]

const { data: outputs, pending: outputPending } = await useFetch('/api/IO/analog-output', {
  query: { machineId: machineId.value },
})

const outputColumns = [
  {
    name: 'id',
    label: 'ID',
    field: row => row.id,
    align: 'left',
  },
  {
    name: 'name',
    label: 'Giriş/Çıkış Adı',
    field: row => row.name,
    align: 'left',
  },
]
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
              <q-table
                :loading="inputPending"
                :rows="inputs"
                :columns="inputColumns"
                hide-pagination
                :pagination="{ rowsPerPage: 0 }"
                row-key="reasonId"
                separator="cell"
                bordered
                table-header-class="table-header"
              />
            </q-tab-panel>

            <q-tab-panel name="outputs">
              <q-table
                :loading="outputPending"
                :rows="outputs"
                :columns="outputColumns"
                hide-pagination
                :pagination="{ rowsPerPage: 0 }"
                row-key="reasonId"
                separator="cell"
                bordered
                table-header-class="table-header"
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
