<script setup lang="ts">
import * as d3 from 'd3'
import type { AnalogInputOutputType, CalculatedValue, Counter, IOSetting } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'
import { getCommandsWithClosestTime } from '~/utils/functions'

const props = defineProps<{
  commands: AnalogInputOutputType[] | Counter[] | CalculatedValue[]
  selectedTime: Date
  typeKey: 'analogInputs' | 'analogOutputs' | 'counters' | 'calculatedValues'
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
function updateAxis(setting: IOSetting) {
  const axis = settingsStore.axises.get(setting.axis)
  axis!.max = 0
  axis!.min = 0
}
</script>

<template>
  <div class="py-2 overflow-y-auto h-full space-y-0.5 divide-y-1 divide-gray-300">
    <IOLine
      v-for="command in commandsWithClosestTime"
      :key="command.ioIndex"
      :setting="settingsStore.getSetting(`${typeKey}_${command.ioIndex}`)"
      :command="command"
      io-type="Analog"
      :type-key="typeKey"
      :value="`${command.closestIoValue.value.toFixed(2)}`"
      @update:setting="(setting: IOSetting) => updateSetting(`${typeKey}_${command.ioIndex}`, setting)"
      @update:axis="(setting: IOSetting) => updateAxis(setting)"
    />
  </div>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
