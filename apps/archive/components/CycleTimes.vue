<script setup lang="ts">
import * as d3 from 'd3'
import type { AnalogInputOutputType, IOSetting, Reel } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'
import { getCommandsWithClosestTime } from '~/utils/functions'

const props = defineProps<{
  cycles: Reel[]
  selectedTime: Date
}>()

const settingsStore = userSettingsStore()
const { t } = useI18n()
const cyclesWithClosestCycleCount = computed(() => {
  const selectedTime = props.selectedTime.getTime()

  return props.cycles.map((cycle) => {
    const closestCount = cycle?.cycles?.length > 0
      ? cycle.cycles.reduce((closest, current) => {
        const currentTime = new Date(current.cycledAt).getTime()
        const closestTime = new Date(closest.cycledAt).getTime()
        const currentDiff = Math.abs(currentTime - selectedTime)
        const closestDiff = Math.abs(closestTime - selectedTime)

        return currentDiff < closestDiff ? current : closest
      })
      : { cycledAt: '', count: 0 }

    return { ...cycle, closestCount }
  })
})
</script>

<template>
  <div class="py-2 overflow-y-auto h-full space-y-0.5 divide-y-1 divide-gray-300">
    <div v-for="cycle in cyclesWithClosestCycleCount" :key="`${cycle.reelNo}reelNo`">
      <div class="flex items-center flex-nowrap mb-1">
        <q-checkbox
          :model-value="settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`).selected"
          dense
          class="mx-2"
          @update:model-value="
            settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, {
              selected: $event,
            })
          "
        />
        <AxisSettingsButton
          :setting="settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`)"
          :command="{ name: `${cycle.reelNo + 1}. ${t('reel')}` }"
          @update:setting="setting => settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, setting)"
        />

        <span class="ml-4">
          {{ `${cycle.reelNo + 1}. ${t("reel")}` }}
        </span>
        <q-space />
        <span class="mr-4">
          {{ cycle.closestCount.count + 1 }}. {{ `${t('cycle')}` }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
