<script setup lang="ts">
import type { Reel } from '~/types/archive'
import { userSettingsStore } from '~/composables/userSettingsStore'

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
  <q-list class="py-2 overflow-y-auto h-full bg-white" separator>
    <q-item
      v-for="cycle in cyclesWithClosestCycleCount"
      :key="`${cycle.reelNo}reelNo`"
      dense
    >
      <!-- Checkbox -->
      <q-item-section side>
        <q-checkbox
          :model-value="settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`).selected"
          dense
          @update:model-value="
            settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, {
              selected: $event,
            })
          "
        />
      </q-item-section>

      <!-- Title -->
      <q-item-section>
        <div class="row items-center no-wrap">
          <AxisSettingsButton
            :setting="settingsStore.getSetting(`cycleTimes_${cycle.reelNo}`)"
            :command="{ name: `${cycle.reelNo + 1}. ${t('reel')}` }"
            @update:setting="setting =>
              settingsStore.updateSetting(`cycleTimes_${cycle.reelNo}`, setting)
            "
          />

          <span class="ml-2">
            {{ `${cycle.reelNo + 1}. ${t("reel")}` }}
          </span>
        </div>
      </q-item-section>

      <!-- Cycle -->
      <q-item-section side>
        <span>
          {{ cycle.closestCount.count + 1 }}. {{ t("cycle") }}
        </span>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped>
.adjust-font {
  font-size: inherit;
}
</style>
