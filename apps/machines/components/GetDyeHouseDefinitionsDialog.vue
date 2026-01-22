<script setup lang="ts">
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const kc = useKeycloak()

const { t } = useI18n()

function createDefaultOptions() {
  return {
    users: false,
    manualReasons: false,
    machineIdleReasons: false,
    machineFinishReasons: false,
  }
}

const options = ref<Record<string, boolean>>(createDefaultOptions())

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => options.value,
  setState: (state) => {
    options.value = state ? { ...state } : createDefaultOptions()
  },
  isOpen: () => props.show,
})

const { notifySuccess, notifyError } = useNotify()

async function loadDefinitions() {
  try {
    await kc.fetch('/api/sync/download-dye-house-definitions', {
      method: 'POST',
      body: {
        machineId: props.selected.machineId,
        options: options.value,
      },
    })
    notifySuccess(t('definitionsDownloaded'))
    markSaved()
  } catch (error) {
    notifyError(t('errorDuringProcess'))
  }
}

function handleCancel() {
  requestClose(() => emit('close'))
}

function selectAll() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = true
  })
}

function deselectAll() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = false
  })
}

function reverseSelected() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = !options.value[key]
  })
}
</script>

<template>
  <q-dialog
    :model-value="show"
    :persistent="hasChanges"
    @hide="emit('close')"
  >
    <q-card class="p-8 min-w-[1000px]">
      <div class="flex mb-4">
        <h3 class="flex grow justify-center">
          {{ t('getDyeHouseDefinitions') }}
        </h3>
        <q-icon
          name="close"
          class="cursor-pointer"
          size="1.5em"
          @click="handleCancel"
        />
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <q-checkbox v-model="options.users" :label="t('users')" />
        <q-checkbox v-model="options.manualReasons" :label="t('manualReasons')" />
        <q-checkbox v-model="options.machineIdleReasons" :label="t('machineIdleReasons')" />
        <q-checkbox v-model="options.machineFinishReasons" :label="t('machineFinishReasons')" />
      </div>
      <div class="flex flex-row gap-4 justify-end">
        <q-btn
          no-caps
          :label="t('selectAll')"
          @click="selectAll"
        />
        <q-btn
          no-caps
          :label="t('deselectAll')"
          @click="deselectAll"
        />
        <q-btn
          no-caps
          :label="t('reverseSelected')"
          @click="reverseSelected"
        />
        <q-btn
          no-caps
          :label="t('cancel')"
          @click="handleCancel"
        />
        <q-btn
          no-caps
          :label="t('get')"
          @click="loadDefinitions"
        />
      </div>
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
