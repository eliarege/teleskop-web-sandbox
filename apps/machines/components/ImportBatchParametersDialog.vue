<script setup lang="ts">
import type { BatchParam, Machine } from '~/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'addBatchParam'])

const { t } = useI18n()

const selectedMachineId = ref<number>()
const selectedParam = ref<BatchParam>()

const { data: machines } = useAuthFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: batchParameters } = useAuthFetch('/api/starting-parameter-types/starting-parameters', {
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
      class="min-w-[1000px]"
    >
      <q-card-section>
        <q-icon
          name="close"
          class="flex justify-end w-full mb-4 cursor-pointer"
          size="1.5em"
          @click="$emit('close')"
        />
      </q-card-section>
      <q-card-section class="flex flex-col gap-8">
        <q-select
          :model-value="selectedMachineId"
          :options="machines"
          option-label="machineCode"
          option-value="machineId"
          :label="t('machine')"
          filled
          @update:model-value="(e) => selectedMachineId = e.machineId"
        />

        <q-list
          bordered
          separator
          class="overflow-y-auto h-140"
        >
          <q-item
            v-for="param in batchParameters"
            :key="param.paramId"
            v-ripple
            clickable
            :focused="selectedParam?.paramId === param.paramId"
            :active="selectedParam?.paramId === param.paramId"
            @click="selectedParam = param"
          >
            <q-item-section>
              {{ param.paramString }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right" class="m-4">
        <q-btn
          :label="t('cancel')"
          @click="emit('close')"
        />
        <q-btn
          :label="t('submit')"
          color="primary"
          @click="emit('addBatchParam', selectedParam)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
