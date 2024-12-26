<script setup lang="ts">
import * as d3 from 'd3'
import type { AnalogInputOutputType, IOSetting } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'
import { getCommandsWithClosestTime } from '~/utils/functions'

const props = defineProps<{
  commands: AnalogInputOutputType[]
  selectedTime: Date
  typeKey: 'analogInputs' | 'analogOutputs'
}>()

const settingsStore = userSettingsStore()

const commandsWithClosestTime = computed(() => {
  return getCommandsWithClosestTime(props.selectedTime, props.commands)
})
function updateSetting(key: string, setting: IOSetting) {
  if (setting.selected) {
    setAxisVisibility(setting.axis, true)
  }
  settingsStore.updateSetting(key, setting)
}
</script>

<template>
  <div class="mt-4 overflow-y-auto h-full">
    <div
      v-for="command in commandsWithClosestTime"
      :key="command.ioIndex"
    >
      <IOLine
        :setting="settingsStore.getSetting(`${typeKey}_${command.ioIndex}`)"
        :command="command"
        io-type="Analog"
        :value="`${command.closestIoValue.value.toFixed(2)}`"
        @update:setting="(setting: IOSetting) => updateSetting(`${typeKey}_${command.ioIndex}`, setting)"
      />
    </div>
  </div>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
