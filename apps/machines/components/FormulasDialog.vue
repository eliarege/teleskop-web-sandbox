<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const machineId = computed(() => props.selected.machineId)

const { data: formulas } = useLazyFetch('/api/machines/formulas', {
  query: { machineId: machineId.value },
  default: () => [],
  method: 'POST',
  body: {},
})

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
        <q-icon
          name="close"
          class="flex justify-end w-full mb-4 cursor-pointer"
          size="1.5em"
          @click="$emit('close')"
        />
        <FilterableTable
          :rows="formulas"
          :columns="columns"
          class="overflow-y-auto h-160"
          @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
