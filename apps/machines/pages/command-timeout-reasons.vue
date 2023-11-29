<script setup lang="ts">
import { addCommandTimeoutReason, getMachineCommands, getTimeoutReasons } from '~/utils'

const { data: machines, pending, refresh } = await useFetch('/api/machines/active-machines')

const selectedMachineId = ref()
const selectedCommandNo = ref()
const selectedReasonId = ref()
const machineCommands = ref()
const timeoutReasons = ref()

async function handleMachineClick(machineId: number) {
  const { data } = await useFetch('/api/master-commands/master-commands', { query: { machineId } })
  machineCommands.value = data.value
  selectedMachineId.value = machineId
}

async function handleCommandClick(commandNo: number) {
  const { data: selectedTimeoutReasons } = await useFetch('/api/command-timeout-reasons/selected-timeout-reasons', { query: { machineId: selectedMachineId.value, commandNo } })
  const { data: allTimeoutReasons } = await useFetch('/api/command-timeout-reasons/timeout-reasons')
  timeoutReasons.value = allTimeoutReasons.value.map(r => ({
    ...r,
    checked: selectedTimeoutReasons.value.some(selectedReason => selectedReason.id === r.id),
  }))
  selectedCommandNo.value = commandNo
}

async function handleCheckChange(e, reason) {
  reason.machineId = selectedMachineId.value
  reason.commandNo = selectedCommandNo.value
  console.log('e, reason = ', e, reason)
  if (e)
    await checkTimeoutReason(reason)
  else if (!e)
    await uncheckTimeoutReason(reason)
}
const showAddReasonDialog = ref(false)
const newReasonName = ref('')
async function handleAddReason() {
  console.log('newReasonName.value = ', newReasonName.value)
  await addCommandTimeoutReason(newReasonName.value)
}
</script>

<template>
  <q-dialog :model-value="showAddReasonDialog" @hide="showAddReasonDialog = false">
    <q-card>
      <q-card-section class="flex flex-col items-center">
        <q-input
          v-model="newReasonName"
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
      />
      <q-btn
        push
        label="Sil"
        icon="delete"
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
          :active="selectedMachineId === machine.machineId"
          @click="handleMachineClick(machine.machineId)"
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
          :active="selectedCommandNo === command.commandNo"
          @click="handleCommandClick(command.commandNo)"
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
          :active="selectedReasonId === reason.id"
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
