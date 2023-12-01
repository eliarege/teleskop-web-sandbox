<script setup lang="ts">
const selectedMachineId = ref()

const { data: machines } = useLazyFetch('/api/machines/active-machines')

const { data: selectedCommands } = useLazyFetch('/api/step-skipping-reasons/step-skipping-reason-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const { data: commands } = useLazyFetch('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
  watch: [selectedCommands],
  transform: (commands) => {
    return commands.map(command => ({
      ...command,
      checked: selectedCommands.value ? selectedCommands.value.some(selectedCommand => selectedCommand.commandNo === command.commandNo) : false,
    }))
  },
})

async function handleCheckChange(e, command) {
  command.machineId = selectedMachineId.value
  if (e)
    await checkStepSkippingReason(command)
  else if (!e)
    await uncheckStepSkippingReason(command)
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="selectedMachineId = machine.machineId"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-sm">
      <h3>Komut Listesi</h3>
      <q-list bordered separator>
        <q-item
          v-for="command in commands"
          :key="command.commandNo"
          v-ripple
          clickable
        >
          <q-item-section>
            <q-checkbox
              v-model:model-value="command.checked"
              :label="command.commandName"
              @update:model-value="(e) => handleCheckChange(e, command)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
