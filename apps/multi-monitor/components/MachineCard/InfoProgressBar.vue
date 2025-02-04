<script setup lang="ts">
import type { MachineData } from '~/shared/types'
import { useColorStore } from '~/store/Colors'

interface InfoProgressBarProps {
  data: MachineData
}
const props = defineProps<InfoProgressBarProps>()
const colors = useColorStore()

const completitionRatio = ref(0)
const delay = computed(() => {
  const elapsedTime = props.data.runningPrgElapsedTime
  const totalDuration = props.data.runningPrgTotalTheoreticDuration

  if (elapsedTime && totalDuration && elapsedTime > totalDuration) {
    return elapsedTime - totalDuration
  }
  return 0
})

const delayRatio = computed(() => {
  const totalDuration = props.data.runningPrgTotalTheoreticDuration
  if (delay.value && totalDuration) {
    return Math.round(Math.min((delay.value / totalDuration) * 100, 100))
  }
  return 0
})

watch(
  [() => props.data.runningPrgElapsedTime, () => props.data.runningPrgTotalTheoreticDuration],
  ([elapsedTime, totalDuration]) => {
    if (elapsedTime && totalDuration) {
      const baseRatio = Math.round(Math.min((elapsedTime / totalDuration) * 100, 100))
      completitionRatio.value = Math.max(baseRatio - delayRatio.value, 0)
    } else {
      completitionRatio.value = 0
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="relative h-7 rounded-2xl w-full h-7 overflow-hidden"
    :style="{ background: colors.cardItemBg }"
  >
    <div class="absolute top-0 left-0 w-full h-full">
      <div class="absolute right-0 h-full progress-bar-delay" :style="{ width: `${delayRatio}%` }" />
      <div
        class="progress-bar-slot"
        style="color: black"
      >
        <slot />
      </div>
    </div>
    <div class="relative h-full" :style="{ width: `${100 - delayRatio}%` }">
      <div class="absolute left-0 w-full h-full progress-bar-completion" :style="{ width: `${completitionRatio}%` }" />
      <div class="progress-bar-slot" style="color: white">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar-completion {
  background-color: #6aa84f;
  transition: width 0.3s ease;
}

.progress-bar-delay {
  background: #ffdd00;
  transition: width 0.3s ease;
}

.progress-bar-slot {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
}
</style>
