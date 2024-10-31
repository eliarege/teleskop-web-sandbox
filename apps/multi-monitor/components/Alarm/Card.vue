<script setup lang="ts">
import { updateMachineAlarms } from '~/server/queries/alarms'
import type { MachineAlarm } from '~/shared/types'

const props = defineProps<{ alarms: MachineAlarm[] }>()

const shownTab = ref(props.alarms[0].commands[0].commandNo)
const commandSearch = ref('')

const filteredAlarms = computed(() => {
  if (commandSearch.value === '') {
    return props.alarms
  } else {
    return props.alarms
      .map(machineAlarm => ({
        ...machineAlarm,
        commands: machineAlarm.commands.filter(command =>
          command.commandName.toLowerCase().includes(commandSearch.value.toLowerCase()),
        ),
      }))
      .filter(machineAlarm => machineAlarm.commands.length > 0)
  }
})
async function test(machineId: number, commandNo: number, alarmNo: number) {
  await $fetch('/api/alarms', {
    method: 'PUT',
    body: { machineId, commandNo, alarmNo },
  })
}
</script>

<template>
  <div class="max-h-92vh overflow-auto border-1 border-gray-500/30 rounded">
    <q-input
      v-model="commandSearch"
      bottom-slots
      label="Command Search"
      dense
    >
      <template #append>
        <q-icon
          v-if="commandSearch !== ''"
          name="close"
          class="cursor-pointer"
          @click="commandSearch = ''"
        />
        <q-icon name="search" />
      </template>
    </q-input>

    <div
      v-for="machine in filteredAlarms"
      :key="machine.machineId"
      class="flex-center flex-col"
    >
      <div
        v-if="machine.machineId !== alarms[0].machineId"
        :id="machine.machineId.toString()"
        class="w-full h-1px my-3 bg-black"
        spaaced
      />
      {{ machine.machineName }}
      <q-tabs
        v-model="shownTab"
        dense
        class="text-grey max-w-50vw"
        active-color="primary"
        align="justify"
      >
        <q-tab
          v-for="command in machine.commands"
          :key="command.commandNo"
          :name="command.commandNo"
          :label="`${command.commandNo} ${command.commandName}`"
        />
      </q-tabs>
      <q-tab-panels v-model="shownTab">
        <q-tab-panel
          v-for="command in machine.commands"
          :key="command.commandNo"
          :name="command.commandNo"
          :label="command.commandName"
          class="flex-center gap-7"
        >
          <div
            v-for="alarm in command.alarms"
            :key="alarm.alarmNo"
            class="whitespace-nowrap"
          >
            <q-checkbox
              v-model="alarm.showOnScreen"
              :label="`${alarm.alarmNo} - ${alarm.alarmName}`"
              @click="test(machine.machineId, command.commandNo, alarm.alarmNo)"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<style scoped>
</style>
