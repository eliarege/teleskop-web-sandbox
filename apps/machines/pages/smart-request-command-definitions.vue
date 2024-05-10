<script setup lang="ts">
const { t } = useI18n()

const selectedMachineId = ref()

interface CommandType {
  machineId: number
  id: number
  commandNo: number
}

const changedCommandTypes = ref<CommandType[]>([])

const commandTypeMaps = reactive([
  { id: 101, name: 'tank1Request', data: null, label: t('tank1Request') },
  { id: 102, name: 'tank1Dosage1', data: null, label: t('tank1Dosage1') },
  { id: 103, name: 'tank1Dosage2', data: null, label: t('tank1Dosage2') },
  { id: 201, name: 'tank2Request', data: null, label: t('tank2Request') },
  { id: 202, name: 'tank2Dosage1', data: null, label: t('tank2Dosage1') },
  { id: 203, name: 'tank2Dosage2', data: null, label: t('tank2Dosage2') },
  { id: 301, name: 'tank3Request', data: null, label: t('tank3Request') },
  { id: 302, name: 'tank3Dosage1', data: null, label: t('tank3Dosage1') },
  { id: 303, name: 'tank3Dosage2', data: null, label: t('tank3Dosage2') },
])

const { data: machines } = useLazyFetch('/api/machines/active-machines')
const { data: commandOptions } = useLazyFetch('/api/master-commands/master-commands', {
  query: { machineId: selectedMachineId },
  immediate: false,
  transform: (commandOptions) => {
    commandOptions.unshift({
      commandNo: -1,
      commandName: t('Empty'),
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
    commandTypeMap.data = commands.value.find(t => t.commandType === Number(commandTypeMap.id))?.commandName || t('Empty')
  }
})

async function handleOptionChange(commandTypeName: string) {
  const command = commandTypeMaps.find(c => c.name === commandTypeName)
  if (command && command.data)
    changedCommandTypes.value.push({ machineId: selectedMachineId.value, id: command.id, commandNo: command.data.commandNo })
}

async function handleSubmit() {
  await $fetch('/api/smart-request-commands/smart-request-commands', {
    method: 'PUT',
    body: { changedCommandTypes: changedCommandTypes.value },
  })
  changedCommandTypes.value = []
}
</script>

<template>
  <q-card>
    <q-card-section class="flex flex-row justify-center gap-8">
      <div class="w-sm">
        <h3>{{ t('machines') }}</h3>
        <q-list bordered separator>
          <q-item
            v-for="machine in machines"
            :key="machine.machineId"
            v-ripple
            clickable
            :active="selectedMachineId === machine.machineId"
            :focused="selectedMachineId === machine.machineId"
            @click="selectedMachineId = machine.machineId"
          >
            <q-item-section>
              {{ machine.machineCode }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-xs flex flex-col">
        <div
          v-for="commandMap in commandTypeMaps"
          :key="commandMap.id"
          class="mb-4"
        >
          <q-select
            v-model="commandMap.data"
            :label="commandMap.label"
            :options="commandOptions"
            option-label="commandName"
            option-value="commandNo"
            @update:model-value="handleOptionChange(commandMap.name)"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right" class="mt-4 mr-4">
      <q-btn
        no-caps
        :label="t('cancel')"
        @click="$router.go(0)"
      />
      <q-btn
        color="primary"
        no-caps
        :label="t('submit')"
        @click="handleSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>

</style>
