<script setup lang="ts">
import type { BatchParam, Machine } from '~/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'addBatchParams'])

const { t } = useI18n()

const selectedMachine = ref<Machine>()

const { data: machines } = useAuthFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: batchParameters } = useAuthFetch('/api/starting-parameter-types/starting-parameters', {
  immediate: false,
  default: () => [],
  query: {
    machineId: computed(() => selectedMachine.value?.machineId),
  },
})

async function importAllParameters() {
  if (selectedMachine.value && batchParameters.value.length > 0) {
    emit('addBatchParams', batchParameters.value)
  }
}
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
          :model-value="selectedMachine"
          :options="machines"
          option-label="machineCode"
          :label="t('machine')"
          filled
          @update:model-value="(machine) => selectedMachine = machine"
        />

        <div v-if="selectedMachine">
          <h6 class="text-h6 mb-4">
            {{ t('parametersToImport') }} ({{ batchParameters.length }})
          </h6>
          <q-list
            bordered
            separator
            class="overflow-y-auto h-140"
          >
            <q-item
              v-for="param in batchParameters"
              :key="param.paramId"
            >
              <q-item-section>
                {{ param.paramString }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-else class="text-center text-grey-6 py-8">
          {{ t('selectMachineToViewParameters') }}
        </div>
      </q-card-section>
      <q-card-actions align="right" class="m-4">
        <q-btn
          :label="t('cancel')"
          @click="emit('close')"
        />
        <q-btn
          :label="t('importAllParameters')"
          color="primary"
          :disabled="!selectedMachine || batchParameters.length === 0"
          @click="importAllParameters"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
</style>
