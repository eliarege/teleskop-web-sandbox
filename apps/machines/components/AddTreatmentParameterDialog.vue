<script setup lang="ts">
import type { TreatmentMachineGroup, TreatmentParameter } from '~/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])
const { notifyError, notifySuccess } = useNotify()

const kc = useKeycloak()

const { t } = useI18n()

function createDefaultSelection() {
  return {
    id: -1,
    treatmentParameter: '',
  }
}

const selected = ref<Partial<TreatmentParameter>>(createDefaultSelection())

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => selected.value,
  setState: (state) => {
    selected.value = state ? { ...state } : createDefaultSelection()
  },
  isOpen: () => props.show,
})

const selectedGroupId = ref(-1)

const { data: params, refresh: refreshParams } = useAuthFetch<TreatmentParameter[]>('/api/treatment-parameters/treatment-parameters', {
  default: () => [],
})

async function handleAdd() {
  try {
    await kc.fetch('/api/treatment-parameters/treatment-parameter', {
      method: 'POST',
      body: selected.value,
    })
    await refreshParams()
    selected.value = createDefaultSelection()
    markSaved()
    notifySuccess(t('PARAMETER_CREATED_SUCCESSFULLY'))
  } catch (error: any) {
    if (error.statusCode === 409) {
      notifyError(t('PARAMETER_ALREADY_EXISTS'))
    } else {
      notifyError(t('PARAMETER_ADD_ERROR'))
    }
  }
}
async function handleEdit() {
  try {
    await kc.fetch('/api/treatment-parameters/treatment-parameter', {
      method: 'PUT',
      body: selected.value,
    })
    await refreshParams()
    notifySuccess(t('PARAMETER_UPDATED_SUCCESSFULLY'))
    markSaved()
  } catch (error: any) {
    if (error.statusCode === 409) {
      notifyError(t('PARAMETER_ALREADY_EXISTS'))
    } else {
      notifyError(t('PARAMETER_UPDATE_ERROR'))
    }
  }
}
async function handleDelete() {
  try {
    await kc.fetch('/api/treatment-parameters/treatment-parameter', {
      method: 'DELETE',
      body: selected.value,
    })
    await refreshParams()
    selected.value = createDefaultSelection()
    markSaved()
    notifySuccess(t('PARAMETER_DELETED_SUCCESSFULLY'))
  } catch (error: any) {
    if (error.statusCode === 404) {
      notifyError(t('PARAMETER_NOT_FOUND'))
    } else {
      notifyError(t('PARAMETER_DELETE_ERROR'))
    }
  }
}
async function handleGroupClick(obj: TreatmentParameter) {
  selected.value = obj
  selectedGroupId.value = obj.id
  markSaved()
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
    <q-card class="min-w-[1000px]">
      <q-card-section class="flex flex-col">
        <div class="flex flex-col gap-4">
          <q-input
            v-model="selected.treatmentParameter"
            filled
            placeholder="Parametre Adı"
          />
          <div class="flex gap-4">
            <q-btn
              no-caps
              :label="t('add')"
              @click="handleAdd"
            />
            <q-btn
              no-caps
              :label="t('edit')"
              :disable="selected.id === -1"
              @click="handleEdit"
            />
            <q-btn
              no-caps
              :label="t('delete')"
              :disable="selected.id === -1"
              @click="handleDelete"
            />
            <q-btn
              no-caps
              :label="t('cancel')"
              color="secondary"
              outline
              @click="handleCancel"
            />
          </div>
        </div>
        <div class="my-4">
          <h3>{{ t('parameterList') }}</h3>
          <q-list bordered separator>
            <q-item
              v-for="param in params"
              :key="param.id"
              v-ripple
              clickable
              :active="selected === param"
              :focused="selected === param"
              @click="handleGroupClick(param)"
            >
              <q-item-section>
                {{ param.treatmentParameter }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
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
.input-field > * {
  margin-right: 2em;
}
</style>
