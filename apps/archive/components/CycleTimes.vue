<script setup lang="ts">
import * as d3 from 'd3'
import type { AnalogInputOutputType, IOSetting, Reel } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'
import { getCommandsWithClosestTime } from '~/utils/functions'

defineProps<{
  cycles: Reel[]
  selectedTime: Date
}>()

const settingsStore = userSettingsStore()
const { t } = useI18n()
// const commandsWithClosestTime = computed(() => {
//   return getCommandsWithClosestTime(props.selectedTime, props.commands)
// })
</script>

<template>
  <div class="mt-4 overflow-y-auto h-full">
    <div v-for="cycle in cycles" :key="`${cycle.reelNo}reelNo`">
      <div class="flex items-center flex-nowrap bg-gray-300 mb-1">
        <q-checkbox
          :model-value="
            settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`).selected
          "
          class="mr-4 w-5 h-5"
          @update:model-value="
            settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, {
              selected: $event,
            })
          "
        />

        <q-btn
          class="w-5 h-5"
          padding="none"
          :style="{
            backgroundColor: settingsStore.getSetting(
              `cycleTimes_${cycle.reelNo}`,
            ).color,
          }"
        >
          <q-popup-proxy :transition-duration="0">
            <q-color
              :model-value="
                settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`).color
              "
              @update:model-value="
                settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, {
                  color: $event,
                })
              "
            />
          </q-popup-proxy>
        </q-btn>

        <span class="ml-4">
          {{ `${cycle.reelNo + 1}. ${t("reel")}` }}
        </span>
        <q-space />
      </div>
    </div>
  </div>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
