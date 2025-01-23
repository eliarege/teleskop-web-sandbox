<script setup lang="ts">
import * as d3 from 'd3'
import type { AnalogInputOutputType, Counter, IOSetting } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'
import { getCommandsWithClosestTime } from '~/utils/functions'

const props = defineProps<{
  counters: Counter[]
  selectedTime: Date
}>()

const settingsStore = userSettingsStore()

const commandsWithClosestTime = computed(() => {
  return getCommandsWithClosestTime(props.selectedTime, props.counters)
})
function updateSetting(key: string, setting: IOSetting) {
  if (setting.selected) {
    setAxisVisibility(setting.axis, true)
  }
  settingsStore.updateSetting(key, setting)
}
function updateAxis(key: string, setting: IOSetting) {
  const axis = settingsStore.axises.get(setting.axis)
  axis.max = 0
}
</script>

<template>
  <div class="py-2 overflow-y-auto h-full space-y-0.5 divide-y-1 divide-gray-300">
    <IOLine
      v-for="command in commandsWithClosestTime"
      :key="command.ioIndex"
      :setting="settingsStore.getSetting(`counters_${command.ioIndex}`)"
      :command="command"
      io-type="Analog"
      :value="`${command.closestIoValue.value.toFixed(2)}`"
      @update:setting="(setting: IOSetting) => updateSetting(`counters_${command.ioIndex}`, setting)"
      @update:axis="(setting: IOSetting) => updateAxis(`counters_${command.ioIndex}`, setting)"
    />
  </div>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
