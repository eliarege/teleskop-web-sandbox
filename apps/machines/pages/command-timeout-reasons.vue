<script setup lang="ts">
import type { CommandTimeoutReason, Machine, MasterCommand } from '~/types'

const kc = useKeycloak()
const { t } = useI18n()
const router = useRouter()
const { notifySuccess, notifyError } = useNotify()

const selectedMachineId = ref()
const selectedCommandNo = ref()
const selectedReasonId = ref()
const changedReasons = ref<CommandTimeoutReason[]>([])

watch([selectedMachineId, selectedCommandNo], () => {
  changedReasons.value = []
})

const { data: machines } = useAuthFetch<Machine[]>('/api/machines/active-machines', {
  default: () => [],
})
const { data: machineCommands } = useAuthFetch<MasterCommand[]>(`/api/master-commands/master-commands`, {
  immediate: false,
  query: { machineId: selectedMachineId },
})
const { data: selectedCommandReasons } = useAuthFetch<CommandTimeoutReason[]>('/api/command-timeout-reasons/selected-command-reasons', {
  immediate: false,
  query: { machineId: selectedMachineId, commandNo: selectedCommandNo },
})
const { data: timeoutReasons, refresh: refreshTimeoutReasons } = useAuthFetch<CommandTimeoutReason[]>('/api/command-timeout-reasons/timeout-reasons', {
  immediate: false,
  watch: [selectedCommandReasons],
  transform: (timeoutReasons) => {
    return timeoutReasons.map(r => ({
      ...r,
      checked: selectedCommandReasons.value ? selectedCommandReasons.value.some(selectedReason => selectedReason.id === r.id) : false,
    }))
  },
})

const { data: selectedReasonCommands } = useAuthFetch('/api/command-timeout-reasons/selected-timeout-reasons', {
  immediate: false,
  query: { machineId: selectedMachineId, reasonId: selectedReasonId },
})

function handleCheckChange(e: boolean, reason: CommandTimeoutReason) {
  reason.machineId = selectedMachineId.value
  reason.commandNo = selectedCommandNo.value
  reason.checked = e

  const existingIndex = changedReasons.value.findIndex(
    r => r.id === reason.id && r.machineId === selectedMachineId.value && r.commandNo === selectedCommandNo.value,
  )

  if (existingIndex !== -1) {
    changedReasons.value.splice(existingIndex, 1)
  }

  changedReasons.value.push({ ...reason })
}

async function handleSubmit() {
  try {
    await kc.fetch('/api/command-timeout-reasons/command-timeout-reasons', { method: 'PUT', body: { changedReasons: changedReasons.value } })
    changedReasons.value = []
    notifySuccess(t('savedSuccessfully'))
  } catch (error: any) {
    const errorMessage = error?.data?.statusMessage || 'SAVE_OPERATION_FAILED'
    notifyError(t(errorMessage))
  }
}

const showAddReasonDialog = ref(false)
const showEditReasonDialog = ref(false)

const addReasonText = ref('')
const editReasonText = ref('')

const {
  hasChanges: addHasChanges,
  confirmVisible: addConfirmVisible,
  requestClose: requestAddClose,
  confirmDiscard: confirmAddDiscard,
  keepEditing: keepAddEditing,
} = useUnsavedDialogGuard({
  getState: () => addReasonText.value,
  setState: (state) => {
    addReasonText.value = state || ''
  },
  isOpen: () => showAddReasonDialog.value,
})

const {
  hasChanges: editHasChanges,
  confirmVisible: editConfirmVisible,
  requestClose: requestEditClose,
  confirmDiscard: confirmEditDiscard,
  keepEditing: keepEditEditing,
} = useUnsavedDialogGuard({
  getState: () => editReasonText.value,
  setState: (state) => {
    editReasonText.value = state || ''
  },
  isOpen: () => showEditReasonDialog.value,
})
async function handleAddReason() {
  try {
    await kc.fetch('/api/command-timeout-reasons/command-timeout-reason', {
      method: 'POST',
      body: { reasonText: addReasonText.value },
    })
    showAddReasonDialog.value = false
    addReasonText.value = ''
    await refreshTimeoutReasons()
    notifySuccess(t('addedSuccessfully'))
  } catch (error: any) {
    const errorMessage = error?.data?.statusMessage || 'CREATE_OPERATION_FAILED'
    notifyError(t(errorMessage))
  }
}
function handleEditButton() {
  if (timeoutReasons.value && timeoutReasons.value.length) {
    const reasonText = timeoutReasons.value.find(d => d.id === selectedReasonId.value)?.reasonText
    if (reasonText) {
      editReasonText.value = reasonText
      showEditReasonDialog.value = true
    }
  }
}

async function handleEditReason() {
  try {
    await kc.fetch('/api/command-timeout-reasons/command-timeout-reason', {
      method: 'PUT',
      body: { reasonText: editReasonText.value, id: selectedReasonId.value },
    })
    showEditReasonDialog.value = false
    editReasonText.value = ''
    await refreshTimeoutReasons()
    notifySuccess(t('editedSuccessfully'))
  } catch (error: any) {
    const errorMessage = error?.data?.statusMessage || 'UPDATE_OPERATION_FAILED'
    notifyError(t(errorMessage))
  }
}

function handleAddCancel() {
  requestAddClose(() => {
    showAddReasonDialog.value = false
  })
}

function handleEditCancel() {
  requestEditClose(() => {
    showEditReasonDialog.value = false
  })
}

async function handleDeleteReason() {
  try {
    await kc.fetch('/api/command-timeout-reasons/command-timeout-reason', {
      method: 'DELETE',
      body: { id: selectedReasonId.value },
    })
    await refreshTimeoutReasons()
    notifySuccess(t('deletedSuccessfully'))
  } catch (error: any) {
    const errorMessage = error?.data?.statusMessage || 'DELETE_OPERATION_FAILED'
    notifyError(t(errorMessage))
  }
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value,
    onClick: () => {
      copy.value = selectedMachineId.value
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      try {
        await kc.fetch('/api/command-timeout-reasons/copy', {
          method: 'POST',
          body: { sourceMachineId: copy.value, targetMachineId: selectedMachineId.value },
        })
        notifySuccess(t('copiedSuccessfully'))
      } catch (error: any) {
        const errorMessage = error?.data?.statusMessage || 'COPY_OPERATION_FAILED'
        notifyError(t(errorMessage))
      }
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :options="contextMenuOptions"
      target=".q-list"
      @click="(option) => option.onClick(selectedMachineId)"
    />
    <q-dialog
      :model-value="showAddReasonDialog"
      :persistent="addHasChanges"
      @hide="showAddReasonDialog = false"
    >
      <q-card>
        <q-card-section class="flex flex-col items-center">
          <q-input
            v-model="addReasonText"
            :label="t('addNewReason')"
            class="mb-4"
          />
          <div>
            <q-btn
              :label="t('add')"
              class="mr-4"
              @click="handleAddReason()"
            />
            <q-btn :label="t('cancel')" @click="handleAddCancel" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      :model-value="showEditReasonDialog"
      :persistent="editHasChanges"
      @hide="showEditReasonDialog = false"
    >
      <q-card>
        <q-card-section class="flex flex-col items-center">
          <q-input
            v-model="editReasonText"
            :label="t('editReason')"
            class="mb-4"
          />
          <div>
            <q-btn
              :label="t('edit')"
              class="mr-4"
              @click="handleEditReason()"
            />
            <q-btn :label="t('cancel')" @click="handleEditCancel" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <ConfirmDialog
      v-model="addConfirmVisible"
      :title="t('unsavedChanges.title')"
      :message="t('unsavedChanges.message')"
      :cancel-label="t('unsavedChanges.continue')"
      :confirm-label="t('unsavedChanges.discard')"
      confirm-color="negative"
      @confirm="confirmAddDiscard"
      @cancel="keepAddEditing"
    />
    <ConfirmDialog
      v-model="editConfirmVisible"
      :title="t('unsavedChanges.title')"
      :message="t('unsavedChanges.message')"
      :cancel-label="t('unsavedChanges.continue')"
      :confirm-label="t('unsavedChanges.discard')"
      confirm-color="negative"
      @confirm="confirmEditDiscard"
      @cancel="keepEditEditing"
    />

    <div class="flex justify-end my-4 mr-4">
      <q-btn-group push>
        <q-btn
          push
          :label="t('add')"
          icon="add"
          @click="showAddReasonDialog = true"
        />
        <q-btn
          push
          :label="t('edit')"
          icon="edit"
          :disable="!selectedReasonId"
          @click="handleEditButton()"
        />
        <q-btn
          push
          :label="t('delete')"
          icon="delete"
          :disable="!selectedReasonId"
          @click="handleDeleteReason()"
        />
      </q-btn-group>
    </div>

    <q-card>
      <q-card-section class="flex flex-row justify-around">
        <div class="w-sm">
          <h3>{{ t('machines') }}</h3>
          <q-list
            bordered
            separator
            class="overflow-y-auto h-160"
          >
            <q-item
              v-for="machine in machines"
              :key="machine.machineId"
              v-ripple
              clickable
              :focused="selectedMachineId === machine.machineId"
              :active="selectedMachineId === machine.machineId"
              :class="{ 'bg-primary text-white': selectedMachineId === machine.machineId }"
              @click="selectedMachineId = machine.machineId;selectedReasonId = null;selectedCommandNo = null"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="w-sm">
          <h3>{{ t('commands') }}</h3>
          <q-list
            bordered
            separator
            class="overflow-y-auto h-160"
          >
            <q-item
              v-for="command in machineCommands"
              :key="command.commandNo"
              v-ripple
              clickable
              :focused="selectedCommandNo === command.commandNo"
              :active="selectedReasonCommands && selectedReasonCommands.length ? selectedReasonCommands.some(r => r.commandNo === command.commandNo) : false"
              :class="{ 'bg-primary text-white': selectedCommandNo === command.commandNo }"
              @click="selectedCommandNo = command.commandNo;selectedReasonId = null"
            >
              <q-item-section>
                {{ command.commandName }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="w-sm">
          <h3>{{ t('reasons') }}</h3>
          <q-list
            bordered
            separator
            class="overflow-y-auto h-160"
          >
            <q-item
              v-for="reason in timeoutReasons"
              :key="reason.id"
              v-ripple
              clickable
              :focused="selectedReasonId === reason.id"
              @click="selectedReasonId = reason.id"
            >
              <q-checkbox v-model:model-value="reason.checked" @update:model-value="(e) => handleCheckChange(e, reason)" />
              <q-item-section>
                {{ reason.reasonText }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="mt-4 mr-4">
        <q-btn
          no-caps
          :label="t('cancel')"
          :disable="changedReasons.length === 0"
          @click="router.go(0)"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          :disable="changedReasons.length === 0"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>

</style>
