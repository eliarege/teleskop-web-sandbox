<script setup lang="ts">
const { t } = useI18n()

const selectedMachineId = ref()
const changedCommands = ref([])

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

  changedCommands.value.push({ command, checked: e })
}

async function handleSubmit() {
  await $fetch('/api/step-skipping-reasons/command-reason', {
    method: 'PUT',
    body: { changedCommands: changedCommands.value },
  })
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

      <div class="w-sm">
        <h3>{{ t('commandList') }}</h3>
        <q-list
          bordered
          separator
          class="overflow-y-auto h-160"
        >
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
