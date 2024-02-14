<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const tab = ref('inputs')

const machineId = computed(() => props.selected.machineId)

const { data: inputs } = useLazyFetch('/api/io/analog-input', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const inputColumns = computed(() => ([
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
    label: t('inputOutputName'),
    field: 'name',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

const { data: outputs } = useLazyFetch('/api/io/analog-output', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const outputColumns = computed(() => ([
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
    label: t('inputOutputName'),
    field: 'name',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

async function handleFilterSlotsUpdateInputs(updatedValue) {
  inputs.value = await $fetch('/api/io/analog-input', {
    method: 'POST',
    body: {
      machineId: machineId.value,
      filters: updatedValue,
    },
  })
}

async function handleFilterSlotsUpdateOutputs(updatedValue) {
  outputs.value = await $fetch('/api/io/analog-output', {
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
            <q-tab name="inputs" :label="t('analogInputs')" />
            <q-tab name="outputs" :label="t('analogOutputs')" />
            <q-tab name="other" :label="t('otherSettings')" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="inputs">
              <FilterableTable
                :rows="inputs"
                :columns="inputColumns"
                class="overflow-y-auto h-160"
                @update-filter-slots="evt => handleFilterSlotsUpdateInputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="outputs">
              <FilterableTable
                :rows="outputs"
                :columns="outputColumns"
                class="overflow-y-auto h-160"
                @update-filter-slots="evt => handleFilterSlotsUpdateOutputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="other">
              <div class="h-160">
                <q-input :label="t('maxReelSpeed')" />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
