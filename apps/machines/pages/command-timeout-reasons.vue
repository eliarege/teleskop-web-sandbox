<script setup lang="ts">
import type { IContextMenuOption } from '~/components/ContextMenu.vue'

const { t } = useI18n()

const selectedMachineId = ref()
const selectedCommandNo = ref()
const selectedReasonId = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines', {
  default: () => [],
})
const { data: machineCommands } = useLazyFetch(`/api/master-commands/master-commands`, {
  immediate: false,
  query: { machineId: selectedMachineId },
})
const { data: selectedCommandReasons } = useLazyFetch('/api/command-timeout-reasons/selected-command-reasons', {
  immediate: false,
  query: { machineId: selectedMachineId, commandNo: selectedCommandNo },
})
const { data: timeoutReasons, refresh: refreshTimeoutReasons } = useLazyFetch('/api/command-timeout-reasons/timeout-reasons', {
  immediate: false,
  watch: [selectedCommandReasons],
  transform: (timeoutReasons) => {
    return timeoutReasons.map(r => ({
      ...r,
      checked: selectedCommandReasons.value ? selectedCommandReasons.value.some(selectedReason => selectedReason.id === r.id) : false,
    }))
  },
})

const { data: selectedReasonCommands } = useLazyFetch('/api/command-timeout-reasons/selected-timeout-reasons', {
  immediate: false,
  query: { machineId: selectedMachineId, reasonId: selectedReasonId },
})

async function handleCheckChange(e, reason) {
  reason.machineId = selectedMachineId.value
  reason.commandNo = selectedCommandNo.value
  if (e)
    await checkTimeoutReason(reason)
  else if (!e)
    await uncheckTimeoutReason(reason)
}
const showAddReasonDialog = ref(false)
const showEditReasonDialog = ref(false)

const newReasonText = ref('')
async function handleAddReason() {
  await $fetch('/api/command-timeout-reasons/command-timeout-reason', {
    method: 'POST',
    body: { reasonText: newReasonText.value },
  })
  showAddReasonDialog.value = false
  newReasonText.value = ''
  await refreshTimeoutReasons()
}
function handleEditButton() {
  newReasonText.value = timeoutReasons.value.find(d => d.id === selectedReasonId.value).reasonText
  showEditReasonDialog.value = true
}

async function handleEditReason() {
  await editCommandTimeoutReason(selectedReasonId.value, newReasonText.value)
  showEditReasonDialog.value = false
  newReasonText.value = ''
  await refreshTimeoutReasons()
}

async function handleDeleteReason() {
  await deleteCommandTimeoutReason(selectedReasonId.value)
  await refreshTimeoutReasons()
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
      await $fetch('/api/command-timeout-reasons/copy', {
        method: 'POST',
        body: { sourceMachineId: copy.value, targetMachineId: selectedMachineId.value },
      })
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu :context-menu-options="contextMenuOptions" @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)" />
    <q-dialog :model-value="showAddReasonDialog" @hide="showAddReasonDialog = false">
      <q-card>
        <q-card-section class="flex flex-col items-center">
          <q-input
            v-model="newReasonText"
            :label="t('addNewReason')"
            class="mb-4"
          />
          <div>
            <q-btn
              :label="t('add')"
              class="mr-4"
              @click="handleAddReason()"
            />
            <q-btn :label="t('cancel')" @click="showAddReasonDialog = false" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog :model-value="showEditReasonDialog" @hide="showEditReasonDialog = false">
      <q-card>
        <q-card-section class="flex flex-col items-center">
          <q-input
            v-model="newReasonText"
            :label="t('editReason')"
            class="mb-4"
          />
          <div>
            <q-btn
              :label="t('edit')"
              class="mr-4"
              @click="handleEditReason()"
            />
            <q-btn :label="t('cancel')" @click="showEditReasonDialog = false" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

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
    <q-card class="flex flex-row justify-around">
      <q-card-section class="w-sm">
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
            @click="selectedMachineId = machine.machineId;selectedReasonId = null;selectedCommandNo = null"
          >
            <q-item-section>
              {{ machine.machineCode }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section class="w-sm">
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
            @click="selectedCommandNo = command.commandNo;selectedReasonId = null"
          >
            <q-item-section>
              {{ command.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section class="w-sm">
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
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>

</style>
