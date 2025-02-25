<script setup lang="ts">
import type { PropType } from 'vue'
import type { MachineData } from '~/shared/types'

const props = defineProps({
  data: {
    type: Object as PropType<MachineData>,
    required: true,
  },
  completionRatio: Number,
})
const { t } = useI18n()

const totalDuration = props.data.theoreticalDuration || 0
const elapsedTime = props.data.elapsedTime || 0

const completion = computed(() => Math.min(elapsedTime, totalDuration))

const completionRatio = computed(() => {
  return Math.round((completion.value / totalDuration) * 100) || 0
})

const delay = computed(() => {
  if (elapsedTime > totalDuration) {
    return elapsedTime - totalDuration
  }
  return 0
})

const delayRatio = computed(() => {
  if (delay.value && totalDuration) {
    return Math.round(Math.min((delay.value / totalDuration) * 100, 100))
  }
  return 0
})
</script>

<template>
  <div
    class="relative rounded-2xl w-100px h-4 text-xs overflow-hidden bg-black"
  >
    <QTooltip
      v-if="delayRatio > 0"
      transition-show="scale"
      class="text-black e-border bg-white"
      :offset="[3, 3]"
    >
      {{ t('teleskop.current-delay') }}: {{ delayRatio }}%
    </QTooltip>
    <!--  -->
    <div class="absolute top-0 left-0 w-100px h-full">
      <div class="absolute right-0 h-full progress-bar-delay" :style="{ width: `${delayRatio}%` }" />
      <div
        class="progress-bar"
        style="color: black"
      >
        <div class="absolute w-100px h-full text-center whitespace-nowrap overflow-hidden">
          {{ completionRatio }}%
        </div>
      </div>
    </div>
    <!--  -->
    <div class="relative h-full" :style="{ width: `${100 - delayRatio}%` }">
      <div class="absolute left-0 w-100px h-full progress-bar-completion" :style="{ width: `${completionRatio}%` }" />
      <div class="progress-bar" style="color: white">
        <div class="absolute left-0 w-100px h-full text-center whitespace-nowrap overflow-hidden">
          {{ completionRatio }}%
        </div>
      </div>
    </div>
    <!--  -->
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

.progress-bar {
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
