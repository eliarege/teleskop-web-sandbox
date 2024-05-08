<script setup lang="ts">
import { withBase } from 'ufo'
import { determineTextColor } from 'utils/src/color'
import type { MachineData } from '~/shared/types'

interface MachineStautsProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  machine: MachineData
}
defineProps<MachineStautsProps>()
const baseURL = useRuntimeConfig().app.baseURL
const withBaseURL = (input: string) => withBase(input, baseURL)

function connectionStatus(params: number) {
  if (params === 1) {
    return withBaseURL('/icons/baglanti-var.png')
  } else if (params === 2) {
    return withBaseURL('/icons/baglanti-yok.png')
  } else if (params === 5) {
    return withBaseURL('/icons/batarya.png')
  } else {
    return withBaseURL('/icons/baglantı-sorunlu.png')
  }
}
</script>

<template>
  <div class="machine-info">
    <div class="thermometer" :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }">
      <Icon
        name="jam:temperature"
        color="orange"
        :inline="true"
      />
      {{ Math.round(machine.currentTemperature) }}C°
    </div>
    <div>
      <div
        class="relative w-25"
        :class="machine.runningStepNo === 0 ? 'invisible' : 'visible'"
      >
        <MachineCardProgressBar
          :data="machine"
          :completition-ratio="(machine.elapsedTime! / machine.theoreticalDuration!) * 100"
        />
      </div>
    </div>
    <!-- ICONS -->
    <div class="machine-icons">
      <img
        v-if="machine.runningBatchStatus !== 0"
        :src="withBaseURL(machine.runningBatchStatus === 1 ? '/icons/is-emri-off.png' : '/icons/is-emri-on.png')"
      >
      <img :src="connectionStatus(machine.connectionStatus)">
      <img
        v-if="machine.autoManualStatus === 0"
        src="/icons/auto.png"
      >
      <img
        v-if="machine.autoManualStatus === 1"
        src="/icons/manual.png"
      >
      <img
        v-if="machine.isSynchronizing === true"
        src="/icons/bilgi-esitleme.png"
      >
    </div>
  </div>
</template>
