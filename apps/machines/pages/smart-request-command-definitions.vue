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

const commandTypeMap = {
  101: tank1Request,
  102: tank1Dosage1,
  103: tank1Dosage2,
  201: tank2Request,
  202: tank2Dosage1,
  203: tank2Dosage2,
  301: tank3Request,
  302: tank3Dosage1,
  303: tank3Dosage2,
}

const nameToTypeMap = {
  tank1Request: 101,
  tank1Dosage1: 102,
  tank1Dosage2: 103,
  tank2Request: 201,
  tank2Dosage1: 202,
  tank2Dosage2: 203,
  tank3Request: 301,
  tank3Dosage1: 302,
  tank3Dosage2: 303,
}

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

watch(commands, (newValue, oldValue) => {
  for (const [commandType, variable] of Object.entries(commandTypeMap)) {
    variable.value = commands.value.find(t => t.commandType === Number(commandType))?.commandName || 'Boş'
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleOptionChange(commandTypeName) {
  const commandTypeId = nameToTypeMap[commandTypeName]
  const commandNo = commandTypeMap[commandTypeId].value.commandNo
  console.log('selectedMachineId, commandTypeId, commandNo = ', selectedMachineId.value, commandTypeId, commandNo)
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
      <q-select
        v-model="tank1Request"
        label="Tank 1 İstek Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank1Request')"
      />
      <q-select
        v-model="tank1Dosage1"
        label="Tank 1 Dozaj1 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank1Dosage1')"
      />
      <q-select
        v-model="tank1Dosage2"
        label="Tank 1 Dozaj2 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank1Dosage2')"
      />

      <q-select
        v-model="tank2Request"
        label="Tank 2 İstek Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank2Request')"
      />
      <q-select
        v-model="tank2Dosage1"
        label="Tank 2 Dozaj1 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank2Dosage1')"
      />
      <q-select
        v-model="tank2Dosage2"
        label="Tank 2 Dozaj2 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank2Dosage2')"
      />

      <q-select
        v-model="tank3Request"
        label="Tank 3 İstek Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank3Request')"
      />
      <q-select
        v-model="tank3Dosage1"
        label="Tank 3 Dozaj1 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank3Dosage1')"
      />
      <q-select
        v-model="tank3Dosage2"
        label="Tank 3 Dozaj2 Komutları"
        :options="commandOptions"
        option-label="commandName"
        option-value="commandNo"
        @update:model-value="handleOptionChange('tank3Dosage2')"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>

</style>
