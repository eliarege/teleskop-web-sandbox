<script setup lang="ts">
import type { BatchParam, Machine } from '~/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'addBatchParams'])

const { t } = useI18n()

const selectedMachine = ref<Machine | undefined>()

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => ({ selectedMachine: selectedMachine.value }),
  setState: (state) => {
    selectedMachine.value = state?.selectedMachine
  },
  isOpen: () => props.show,
})

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
    markSaved()
  }
}

function handleCancel() {
  requestClose(() => emit('close'))
}
</script>

<template>
  <q-dialog
    :model-value="props.show"
    :persistent="hasChanges"
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
          @click="handleCancel"
        />
      </q-card-section>
      <q-card-section class="flex flex-col gap-8">
        <q-select
          v-model="selectedMachine"
          :options="machines"
          option-label="machineCode"
          :label="t('machine')"
          filled
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
          @click="handleCancel"
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

  <ConfirmDialog
    v-model="confirmVisible"
    :title="t('unsavedChanges.title')"
    :message="t('unsavedChanges.message')"
    :cancel-label="t('unsavedChanges.continue')"
    :confirm-label="t('unsavedChanges.discard')"
    confirm-color="negative"
    @confirm="confirmDiscard"
    @cancel="keepEditing"
  />
</template>

<style scoped>
</style>
