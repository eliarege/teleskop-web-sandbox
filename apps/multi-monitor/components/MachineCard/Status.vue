<script setup lang="ts">
import { withBase } from 'ufo'
import { determineTextColor } from '@teleskop/utils'
import type { MachineData } from '~/shared/types'
import { AppList } from '~/shared/constants'

interface MachineStautsProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  isScreenViable: boolean
  machine: MachineData
}
const props = defineProps<MachineStautsProps>()
const config = useRuntimeConfig()
const { t } = useI18n()
const baseURL = config.app.baseURL
const withBaseURL = (input: string) => withBase(input, baseURL)
const keycloak = useKeycloak()

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
  if (batchStatus !== 0) {
    return `/details/${id}`
  }
}
const archiveUrl = computed(() => parseAppList(config.public.appList).find(e => e.name === AppList.archive)?.url)
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
            :to="computedVncLink"
            :target="computedVncTarget"
            :class="isScreenViable ? '' : 'cursor-not-allowed'"
          >
            <TwIcon
              name="i-material-symbols:monitor-outline"
              size="20px"
              :color="determineTextColor(colors.backGround)"
            />
            <QTooltip>VNC</QTooltip>
          </NuxtLink>
          <NuxtLink :to="handleRouting(machine.runningBatchStatus, machine.id)" :class="machine.runningStepNo !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'">
            <TwIcon
              name="i-mdi:card-account-details-outline"
              size="20px"
              :color="determineTextColor(colors.backGround)"
            />
            <QTooltip>{{ t('details._') }}</QTooltip>
          </NuxtLink>
          <NuxtLink
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
            <QTooltip>{{ t('archive-monitor') }}</QTooltip>
          </NuxtLink>
        </div>
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
