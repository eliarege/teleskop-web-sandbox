<script setup lang="ts">
import { withBase } from 'ufo'
import { determineTextColor } from '@teleskop/utils'
import type { MachineData } from '~/shared/types'
import { Apps } from '~/shared/constants'
import { AutoManualStatus, BatchStatus, ConnectionStatus } from '~/shared/enums'

interface MachineStatusProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  isScreenViable: boolean
  machine: MachineData
}
const props = defineProps<MachineStatusProps>()
const config = useRuntimeConfig()
const { t } = useI18n()
const baseURL = config.app.baseURL
const withBaseURL = (input: string) => withBase(input, baseURL)
const appList = useAppList()

function connectionStatus(params: number) {
  if (params === ConnectionStatus.CONNECTED) {
    return withBaseURL('/icons/baglanti-var.png')
  } else if (params === ConnectionStatus.NOTCONNECTED) {
    return withBaseURL('/icons/baglanti-yok.png')
  } else if (params === ConnectionStatus.BATTERY_LOW) {
    return withBaseURL('/icons/batarya.png')
  } else {
    return withBaseURL('/icons/baglantı-sorunlu.png')
  }
}
const computedVncLink = computed(() => {
  if (!props.isScreenViable)
    return '/'
  return `/vnc/${props.machine.id}`
})

const computedVncTarget = computed(() => {
  if (!props.isScreenViable) {
    return '_self'
  }
  return '_blank'
})

function handleRouting(batchStatus: number, id: number) {
  if (batchStatus !== BatchStatus.IDLE) {
    return `/details/${id}`
  }
}
const archiveUrl = computed(() => appList.find(a => a.name === Apps.archive)?.url ?? null)
</script>

<template>
  <div class="machine-info">
    <div class="thermometer" :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }">
      <TwIcon
        name="i-jam:temperature"
        color="orange"
      />
      {{ Math.round(machine.currentTemperature) }}C°
    </div>
    <div>
      <div class="relative w-25">
        <MachineCardProgressBar
          :data="machine"
          :completition-ratio="(machine.elapsedTime! / machine.theoreticalDuration!) * 100"
          :class="machine.runningStepNo === 0 ? 'invisible' : 'visible'"
        />
        <div class="flex-center gap-3 ml-1">
          <NuxtLink
            v-if="machine.hasVNC"
            :to="computedVncLink"
            :target="computedVncTarget"
            :class="isScreenViable ? '' : 'cursor-not-allowed'"
          >
            <TwIcon
              name="i-material-symbols:monitor-outline"
              size="20px"
              :color="determineTextColor(colors.backGround)"
            />
            <QTooltip
              transition-show="scale"
              class="text-black e-border bg-white"
              :offset="[3, 3]"
            >
              VNC
            </QTooltip>
          </NuxtLink>
          <NuxtLink :to="handleRouting(machine.runningBatchStatus, machine.id)" :class="machine.runningStepNo !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'">
            <TwIcon
              name="i-mdi:card-account-details-outline"
              size="20px"
              :color="determineTextColor(colors.backGround)"
            />
            <QTooltip
              transition-show="scale"
              class="text-black e-border bg-white"
              :offset="[3, 3]"
            >
              {{ t('details._') }}
            </QTooltip>
          </NuxtLink>
          <NuxtLink
            v-if="archiveUrl !== null && machine.runningBatchStatus !== BatchStatus.IDLE"
            external
            target="_blank"
            :to="`${archiveUrl}/${machine.runningBatchKey}`"
            :class="machine.runningStepNo !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
          >
            <TwIcon
              name="i-mdi:chart-line"
              size="20px"
              :color="determineTextColor(colors.backGround)"
            />
            <QTooltip
              transition-show="scale"
              class="text-black e-border bg-white"
              :offset="[3, 3]"
            >
              {{ t('archive-monitor') }}
            </QTooltip>
          </NuxtLink>
        </div>
      </div>
    </div>
    <!-- ICONS -->
    <div v-if="machine.machineError" class="w-full h-full flex-center">
      <TwIcon
        name="i-mdi:warning-octagon"
        size="43px"
        color="red"
      />
      <QTooltip anchor="top middle">
        {{ t('machine-error') }}
      </QTooltip>
    </div>
    <div v-else class="machine-icons">
      <img
        v-if="machine.runningBatchStatus !== BatchStatus.IDLE"
        :src="withBaseURL(machine.runningBatchStatus === BatchStatus.STOPPED ? '/icons/is-emri-off.png' : '/icons/is-emri-on.png')"
      >
      <img :src="connectionStatus(machine.connectionStatus)">
      <img
        v-if="machine.autoManualStatus === AutoManualStatus.AUTO"
        src="/icons/auto.png"
      >
      <img
        v-if="machine.autoManualStatus === AutoManualStatus.MANUAL && machine.runningBatchStatus !== BatchStatus.IDLE"
        src="/icons/manual.png"
      >
      <img
        v-if="machine.isSynchronizing === true"
        src="/icons/bilgi-esitleme.png"
      >
    </div>
  </div>
</template>
