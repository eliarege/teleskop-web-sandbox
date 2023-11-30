<script setup lang="ts">
import { addCommandTimeoutReason, getMachineCommands, getTimeoutReasons } from '~/utils'

const selectedMachineId = ref()
const selectedCommandNo = ref()
const selectedReasonId = ref()

const { data: machines } = useFetch('/api/machines/active-machines')
const { data: machineCommands } = useLazyFetch(`/api/master-commands/master-commands`, {
  immediate: false,
  query: { machineId: selectedMachineId },
})
const { data: selectedCommandReasons } = useLazyFetch('/api/command-timeout-reasons/selected-command-reasons', {
  immediate: false,
  query: { machineId: selectedMachineId, commandNo: selectedCommandNo },
})
const { data: timeoutReasons, refresh: refreshTimeoutReasons } = useLazyFetch('/api/command-timeout-reasons/timeout-reasons', {
  immediate: true,
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
  await addCommandTimeoutReason(newReasonText.value)
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
</script>

<template>
  <q-dialog :model-value="showAddReasonDialog" @hide="showAddReasonDialog = false">
    <q-card>
      <q-card-section class="flex flex-col items-center">
        <q-input
          v-model="newReasonText"
          label="Yeni Sebep Ekle"
          class="mb-4"
        />
        <div>
          <q-btn
            label="Ekle"
            class="mr-4"
            @click="handleAddReason()"
          />
          <q-btn label="İptal" @click="showAddReasonDialog = false" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog :model-value="showEditReasonDialog" @hide="showEditReasonDialog = false">
    <q-card>
      <q-card-section class="flex flex-col items-center">
        <q-input
          v-model="newReasonText"
          label="Sebep Düzenle"
          class="mb-4"
        />
        <div>
          <q-btn
            label="Düzenle"
            class="mr-4"
            @click="handleEditReason()"
          />
          <q-btn label="İptal" @click="showEditReasonDialog = false" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <div class="flex justify-end mb-4 mr-4">
    <q-btn-group push>
      <q-btn
        push
        label="Ekle"
        icon="add"
        @click="showAddReasonDialog = true"
      />
      <q-btn
        push
        label="Düzenle"
        icon="edit"
        @click="handleEditButton()"
      />
      <q-btn
        push
        label="Sil"
        icon="delete"
        @click="handleDeleteReason()"
      />
    </q-btn-group>
  </div>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          :focused="selectedMachineId === machine.machineId"
          @click="selectedMachineId = machine.machineId"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>Komutlar</h3>
      <q-list bordered separator>
        <q-item
          v-for="command in machineCommands"
          :key="command.commandNo"
          v-ripple
          clickable
          :focused="selectedCommandNo === command.commandNo"
          :active="selectedReasonCommands && selectedReasonCommands.length ? selectedReasonCommands.some(r => r.commandNo === command.commandNo) : false"
          @click="selectedCommandNo = command.commandNo"
        >
          <q-item-section>
            {{ command.commandName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>Sebepler</h3>
      <q-list bordered separator>
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
</template>

<style scoped>

</style>
