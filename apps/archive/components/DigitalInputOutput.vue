<script setup lang="ts">
import { userSettingsStore } from '~/composables/userSettingsStore'
import type { DigitalInputOutputType, IOSetting } from '~/types/archive'

const props = defineProps<{
  commands: DigitalInputOutputType[]
  selectedTime: Date
  typeKey: 'digitalInputs' | 'digitalOutputs' | 'digitalOutputsLock'
}>()

const { t } = useI18n()
const settingsStore = userSettingsStore()

const commandsWithClosestTime = computed(() => {
  return getCommandsWithClosestTimeDigital(props.selectedTime, props.commands)
})
</script>

<template>
  <q-list class="py-2 h-full overflow-y-auto bg-white" separator>
    <IOLine
      v-for="command in commandsWithClosestTime"
      :key="command.ioIndex"
      :setting="settingsStore.getSetting(`${typeKey}_${command.ioIndex}`)"
      :command="command"
      io-type="Digital"
      :value="command.closestIoValue.value === 1
        ? t('inputOutput.open')
        : t('inputOutput.closed')"
      @update:setting="(setting: IOSetting) =>
        settingsStore.setSetting(
          `${typeKey}_${command.ioIndex}`,
          setting.color,
          setting.selected,
          setting.axis,
        )"
    />
  </q-list>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
