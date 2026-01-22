<script setup lang="ts">
import type { FilterableTableColumn, FilterableTableFilter } from '@teleskop/nuxt-base'
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Partial<Machine>
}>()

const emit = defineEmits(['close'])

const kc = useKeycloak()

const { t } = useI18n()

const tab = ref('inputs')

const machineId = computed(() => props.selected.machineId)
const maxReelSpeed = ref(0)

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => maxReelSpeed.value,
  setState: (state) => {
    maxReelSpeed.value = typeof state === 'number' ? state : 0
  },
  isOpen: () => props.show,
})

const { data: inputs } = useAuthFetch('/api/io/analog-input', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const inputColumns = computed<FilterableTableColumn[]>(() => ([
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

const { data: outputs } = useAuthFetch('/api/io/analog-output', {
  body: { machineId: machineId.value },
  method: 'POST',
  default: () => [],
})

const outputColumns = computed<FilterableTableColumn[]>(() => ([
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

async function handleFilterSlotsUpdateInputs(updatedValue: FilterableTableFilter[]) {
  inputs.value = await kc.fetch('/api/io/analog-input', {
    method: 'POST',
    body: {
      machineId: machineId.value,
      filters: updatedValue,
    },
  })
}

async function handleFilterSlotsUpdateOutputs(updatedValue: FilterableTableFilter[]) {
  outputs.value = await kc.fetch('/api/io/analog-output', {
    method: 'POST',
    body: {
      machineId: machineId.value,
      filters: updatedValue,
    },
  })
}

async function handleSubmit() {
  await kc.fetch('/api/machine/max-reel-speed', {
    method: 'PUT',
    body: {
      machineId: machineId.value,
      maxReelSpeed: maxReelSpeed.value,
    },
  })
  markSaved()
}

function handleCancel() {
  requestClose(() => emit('close'))
}
</script>

<template>
  <q-dialog
    :model-value="show"
    :persistent="hasChanges"
    @hide="emit('close')"
  >
    <q-card class="min-w-[1000px]">
      <q-card-section>
        <q-icon
          name="close"
          class="flex justify-end w-full mb-4 cursor-pointer"
          size="1.5em"
          @click="handleCancel"
        />
        <q-card-section>
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
                @update-filter-slots="(evt) => handleFilterSlotsUpdateInputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="outputs">
              <FilterableTable
                :rows="outputs"
                :columns="outputColumns"
                class="overflow-y-auto h-160"
                @update-filter-slots="(evt) => handleFilterSlotsUpdateOutputs(evt)"
              />
            </q-tab-panel>

            <q-tab-panel name="other">
              <div class="h-160 flex flex-col gap-4">
                <q-input v-model="maxReelSpeed" :label="t('maxReelSpeed')" />
                <div class="flex gap-2 self-end">
                  <q-btn
                    :label="t('cancel')"
                    flat
                    class="w-32"
                    @click="handleCancel"
                  />
                  <q-btn
                    :label="t('submit')"
                    color="primary"
                    class="w-32"
                    @click="handleSubmit"
                  />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card-section>
    </q-card>
  </q-dialog>

  <MaConfirmDialog
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
