<script setup lang="ts">
const selectedMachineId = ref()

const tank1Request = ref()
const tank1Dosage1 = ref()
const tank1Dosage2 = ref()
const tank2Request = ref()
const tank2Dosage1 = ref()
const tank2Dosage2 = ref()
const tank3Request = ref()
const tank3Dosage1 = ref()
const tank3Dosage2 = ref()

const commandTypeMaps = reactive([
  { id: 101, name: 'tank1Request', data: tank1Request, label: 'Tank 1 İstek Komutları' },
  { id: 102, name: 'tank1Dosage1', data: tank1Dosage1, label: 'Tank 1 Dozaj1 Komutları' },
  { id: 103, name: 'tank1Dosage2', data: tank1Dosage2, label: 'Tank 1 Dozaj2 Komutları' },

  { id: 201, name: 'tank2Request', data: tank2Request, label: 'Tank 2 İstek Komutları' },
  { id: 202, name: 'tank2Dosage1', data: tank2Dosage1, label: 'Tank 2 Dozaj1 Komutları' },
  { id: 203, name: 'tank2Dosage2', data: tank2Dosage2, label: 'Tank 2 Dozaj2 Komutları' },

  { id: 301, name: 'tank3Request', data: tank3Request, label: 'Tank 3 İstek Komutları' },
  { id: 302, name: 'tank3Dosage1', data: tank3Dosage1, label: 'Tank 3 Dozaj1 Komutları' },
  { id: 303, name: 'tank3Dosage2', data: tank3Dosage2, label: 'Tank 3 Dozaj2 Komutları' },
])

const { data: machines } = useLazyFetch('/api/machines/active-machines')
const { data: commandOptions } = useLazyFetch('/api/master-commands/master-commands', {
  query: { machineId: selectedMachineId },
  immediate: false,
  transform: (commandOptions) => {
    commandOptions.unshift({
      commandNo: -1,
      commandName: 'Boş',
    })
    return commandOptions
  },
})

const { data: commands } = useLazyFetch('/api/smart-request-commands/smart-request-commands', {
  query: { machineId: selectedMachineId },
  immediate: false,
})

watch(commands, (_newValue, _oldValue) => {
  for (const commandTypeMap of commandTypeMaps) {
    commandTypeMap.data = commands.value.find(t => t.commandType === Number(commandTypeMap.id))?.commandName || 'Boş'
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleOptionChange(commandTypeName) {
  const command = commandTypeMaps.find(c => c.name === commandTypeName)
  const commandTypeId = command.id
  const commandNo = command.data.commandNo
  await selectSmartRequestCommand(selectedMachineId.value, commandTypeId, commandNo)
}
</script>

<template>
  <q-card class="flex flex-row justify-center">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="w-xs flex flex-col">
      <div v-for="commandMap in commandTypeMaps" :key="commandMap.id">
        <q-select
          v-model="commandMap.data"
          :label="commandMap.label"
          :options="commandOptions"
          option-label="commandName"
          option-value="commandNo"
          @update:model-value="handleOptionChange(commandMap.name)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
