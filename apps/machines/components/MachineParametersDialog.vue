<script setup lang="ts">
import type { Column } from 'nuxt-ui-types'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()
const columns = computed(() => ([
  {
    name: 'id',
    label: 'Parametre No',
    field: 'id',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'paramString',
    label: t('name'),
    field: 'paramString',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'paramLowLimit',
    label: t('paramLowLimit'),
    field: 'paramLowLimit',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'paramHighLimit',
    label: t('paramHighLimit'),
    field: 'paramHighLimit',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'defaultValue',
    label: t('defaultValue'),
    field: 'defaultValue',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'currentValue',
    label: t('currentValue'),
    field: 'currentValue',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
]))

const id = computed(() => props.selected.machineId)
const { data: params } = useLazyFetch('/api/machines/machine-parameters', {
  default: () => [],
  method: 'POST',
  body: { machineId: id.value },
})

async function handleFilterSlotsUpdate(updatedValue) {
  params.value = await $fetch('/api/machines/machine-parameters', {
    method: 'POST',
    body: {
      machineId: id.value,
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
          :rows="params"
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
