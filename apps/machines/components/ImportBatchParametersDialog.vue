<script setup lang="ts">
import type { BatchParam, Machine } from '~/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'addBatchParam'])

const { t } = useI18n()

const selectedMachineId = ref<number>()
const selectedParam = ref<BatchParam>()

const { data: machines } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: batchParameters } = useLazyFetch('/api/starting-parameter-types/starting-parameters', {
  immediate: false,
  default: () => [],
  query: {
    machineId: selectedMachineId,
  },
})
</script>

<template>
  <q-dialog
    :model-value="props.show"
    @hide="emit('close')"
  >
    <q-card
      class="w-2xl"
    >
      <q-card-section class="flex flex-col gap-8">
        <q-select
          :model-value="selectedMachineId"
          :options="machines"
          option-label="machineCode"
          option-value="machineId"
          label="Makine"
          filled
          @update:model-value="(e) => selectedMachineId = e.machineId"
        />

        <q-list bordered separator class="overflow-y-auto h-160">
          <q-item
            v-for="param in batchParameters"
            :key="param.paramId"
            v-ripple
            clickable
            :focused="selectedParam?.paramId === param.paramId"
            @click="selectedParam = param"
          >
            <q-item-section>
              {{ param.paramString }}
            </q-item-section>
          </q-item>
        </q-list>
        <q-btn-group push class="flex flex-row justify-end w-full">
          <q-btn
            label="İptal"
            color="primary"
            @click="emit('close')"
          />
          <q-btn
            label="Kaydet"
            color="primary"
            @click="emit('addBatchParam', selectedParam)"
          />
        </q-btn-group>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
