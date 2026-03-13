<script setup lang="ts">
import { withBase } from 'ufo'
import { determineTextColor, formatDuration } from '@teleskop/utils'
import type { MachineData } from '~/shared/types'
import { Apps } from '~/shared/constants'
import { AlarmStatus, AutoManualStatus, BatchStatus, ConnectionStatus, RequestStatus } from '~/shared/enums'
import { useColorStore } from '~/store/Colors'
import { useDataStore } from '~/store/Datas'

interface MachineCardProps {
  machine: MachineData | null
}

const props = defineProps<MachineCardProps>()
const store = useDataStore()
const colors = useColorStore()
const { t } = useI18n()
const config = useRuntimeConfig()
const baseURL = config.app.baseURL
const withBaseURL = (input: string) => withBase(input, baseURL)
const appList = useAppList()
const { width: screenWidth } = useWindowSize()

function cardBackgroundColor(runningAlarmNo: number, currentAlarmStatus: number, runningBatchStatus: number) {
  if (runningAlarmNo > 0 && currentAlarmStatus === AlarmStatus.NEW) {
    return '#a30000'
  }
  if (runningBatchStatus !== BatchStatus.RUNNING) {
    return colors.cardIdleBg
  }
  return colors.cardActiveBg
}

function connectionStatus(params: number) {
  if (params === ConnectionStatus.CONNECTED) {
    return withBaseURL('/icons/baglanti-var.png')
  } else if (params === ConnectionStatus.NOTCONNECTED) {
    return withBaseURL('/icons/baglanti-yok.png')
  } else if (params === ConnectionStatus.BATTERY_LOW) {
    return withBaseURL('/icons/batarya.png')
  }
  return withBaseURL('/icons/baglantı-sorunlu.png')
}

function reqStatus(params: number) {
  if (params === RequestStatus.NEW) {
    return t('teleskop.status-new')
  } else if (params === RequestStatus.SENT) {
    return t('teleskop.status-sent')
  } else if (params === RequestStatus.STARTED) {
    return t('teleskop.status-started')
  } else if (params === RequestStatus.FINISHED) {
    return t('teleskop.status-finished')
  } else if (params === RequestStatus.PRIO_CHANGED) {
    return t('teleskop.status-prio')
  }
  return t('teleskop.status-cancelled')
}

const cardColors = computed(() => {
  if (!props.machine) {
    return {
      backGround: colors.cardIdleBg,
      itemBackGround: colors.cardItemBg,
      activeBackGround: colors.cardActiveBg,
      idleBackGround: colors.cardIdleBg,
    }
  }

  return {
    backGround: cardBackgroundColor(
      props.machine.runningAlarmNo,
      props.machine.currentAlarmStatus,
      props.machine.runningBatchStatus,
    ),
    itemBackGround: colors.cardItemBg,
    activeBackGround: colors.cardActiveBg,
    idleBackGround: colors.cardIdleBg,
  }
})

const isScreenViable = computed(() => screenWidth.value >= 900)
const computedVncLink = computed(() => {
  return `/vnc/${props.machine!.id}`
})

const computedVncTarget = computed(() => {
  if (!isScreenViable.value) {
    return '_self'
  }
  return '_blank'
})

const isMachineRunning = computed(() => {
  if (!props.machine) {
    return false
  }
  return props.machine.runningBatchStatus === BatchStatus.RUNNING
})

function handleRouting(batchStatus: number, id: number) {
  if (batchStatus !== BatchStatus.IDLE) {
    return `/details/${id}`
  }
  return '/'
}

const archiveUrl = computed(() => appList.find(a => a.name === Apps.archive)?.url ?? null)

const erpKey = computed(() => {
  if (!props.machine) {
    return ''
  }
  return store.erpKeys.find(e => e.id === props.machine?.id)?.key || ''
})

const stopReasonElapsedTime = computed(() => {
  if (!props.machine) {
    return ''
  }
  const givenDate = new Date(props.machine.stopReasonDateTime)
  const elapsed = Date.now() - givenDate.getTime()
  return formatDuration(elapsed)
})

const manualReasonElapsedTime = computed(() => {
  if (!props.machine) {
    return ''
  }
  const givenDate = new Date(props.machine.manualReasonDateTime)
  const elapsed = Date.now() - givenDate.getTime()
  return formatDuration(elapsed)
})

const infoTextColor = computed(() => {
  if (!props.machine) {
    return ''
  }
  if (props.machine.reqStatus === RequestStatus.FINISHED)
    return 'text-green-500'
  if (props.machine.reqStatus === RequestStatus.CANCELLED)
    return 'text-red-500'
  return ''
})
</script>

<template>
  <div class="card-wrapper lt-sm:(px-2) font-extrabold">
    <div
      v-if="machine"
      class="card-container"
      :style="{ background: cardColors.backGround, color: determineTextColor(cardColors.backGround) }"
    >
      <div class="command-title p-1" :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }">
        <div class="ml-3">
          <q-tooltip
            transition-show="scale"
            class="text-black bg-white"
            :offset="[3, 3]"
          >
            {{ machine.machineIpAddress }}
          </q-tooltip>
          {{ machine.id }}
        </div>
        <div class="w-full flex justify-end">
          <span v-if="store.group"> {{ machine.groupName }} &nbsp; </span>
          {{ machine.loggedInOperatorName }}
        </div>
        <span class="flex w-min whitespace-nowrap text-left">
          {{ machine.name }}
        </span>
      </div>

      <div class="card-items justify-center">
        <span class="card-items__item">{{ machine.runningStartHour }}</span>
        <div class="card-items__item">
          <span>{{ machine.runningJobOrder }}</span>
        </div>
      </div>

      <div class="machine-info">
        <div class="thermometer" :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }">
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
                  :color="determineTextColor(cardColors.backGround)"
                />
                <QTooltip>VNC</QTooltip>
              </NuxtLink>

              <NuxtLink
                target="_blank"
                :to="handleRouting(machine.runningBatchStatus, machine.id)"
                :class="machine.runningStepNo !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
              >
                <TwIcon
                  name="i-mdi:card-account-details-outline"
                  size="20px"
                  :color="determineTextColor(cardColors.backGround)"
                />
                <QTooltip>{{ t('details._') }}</QTooltip>
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
                  :color="determineTextColor(cardColors.backGround)"
                />
                <QTooltip>{{ t('archive-monitor') }}</QTooltip>
              </NuxtLink>
            </div>
          </div>
        </div>

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

      <div class="machine-commands">
        <div v-if="machine.connectionStatus === ConnectionStatus.NOTCONNECTED" class="w-full h-full gap-2 flex-center text-red text-4xl">
          <TwIcon
            name="i-mdi:wifi-off"
            size="36px"
            color="#ef4444"
          />
          {{ t('teleskop.no-connection') }}
        </div>

        <div
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
        >
          <div class="explanation">
            ERP
          </div>
          <q-separator
            color="white"
            vertical
            class="h-full"
            spaced
          />

          <div class="flex-center w-full">
            <template v-if="isMachineRunning">
              <MachineCardSettings :data="machine" />
              <q-tooltip
                transition-show="scale"
                class="text-black e-border bg-white"
                :offset="[3, 3]"
              >
                {{ erpKey || 'ERP' }}
              </q-tooltip>
            </template>
          </div>
        </div>

        <MachineCardInfoProgressBar
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          :data="machine"
        >
          <div class="absolute w-full h-full flex items-center flex-nowrap whitespace-nowrap overflow-hidden top-0 left-0">
            <div class="explanation">
              {{ t('teleskop.program-name') }}
            </div>
            <q-separator
              color="white"
              vertical
              class="h-full"
              spaced
            />

            <span
              class="overflow-hidden"
              :class="machine.runningProgramName.length > 70 ? 'justify-start' : 'justify-center'"
            >
              <template v-if="isMachineRunning">
                {{ machine.runningProgramId }}
                <span v-show="machine.runningProgramName">&nbsp;|&nbsp;</span>
                {{ machine.runningProgramName }}
              </template>
            </span>
          </div>
        </MachineCardInfoProgressBar>

        <div
          v-if="store.isWashing"
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t('teleskop.phase') }}
          </q-tooltip>

          <div class="explanation">
            {{ t('teleskop.phase') }}
          </div>
          <q-separator
            color="white"
            vertical
            class="h-full"
            spaced
          />

          <span class="flex-center w-full">
            <template v-if="isMachineRunning">
              {{ machine.runningPhaseNo }}
              <span v-show="machine.runningPhaseName">&nbsp;|&nbsp;</span>
              {{ machine.runningPhaseName }}
            </template>
          </span>
        </div>

        <div
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t('teleskop.command') }}
          </q-tooltip>

          <div class="explanation">
            {{ t('teleskop.command-info') }}
          </div>
          <q-separator
            color="white"
            vertical
            class="h-full"
            spaced
          />

          <span class="flex-center w-full">
            <template v-if="isMachineRunning">
              {{ machine.runningStepNo }}
              <span v-show="machine.runningCommandNo !== null">
                &nbsp;-&nbsp;
              </span>
              {{ machine.runningCommandNo }}
              <span v-show="machine.runningCommandName">
                &nbsp;-&nbsp;
              </span>
              {{ machine.runningCommandName }}
            </template>
          </span>
        </div>

        <div
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t('teleskop.stop-reason') }}
          </q-tooltip>
          <div class="explanation">
            <span v-if="machine.autoManualStatus">
              {{ t('teleskop.manual-reason') }}
            </span>
            <span v-else>
              {{ t('teleskop.stop-reason') }}
            </span>
          </div>
          <q-separator
            color="white"
            vertical
            class="h-full"
            spaced
          />
          <div class="flex-center w-full">
            <div v-if="machine.autoManualStatus" class="flex-center gap-3">
              <span>{{ machine.manualReason }}</span>
              <span>
                {{ manualReasonElapsedTime }} &nbsp;
                <q-tooltip
                  transition-show="scale"
                  class="text-black e-border bg-white"
                  :offset="[3, 3]"
                >
                  {{ t('teleskop.elapsed-time') }}
                </q-tooltip>
              </span>
            </div>
            <br>
            <div v-if="machine.runningBatchStatus !== BatchStatus.RUNNING" class="flex-center gap-3">
              <span>{{ machine.stopReason }}</span>
              <span>
                {{ stopReasonElapsedTime }} &nbsp;
                <q-tooltip
                  transition-show="scale"
                  class="text-black e-border bg-white"
                  :offset="[3, 3]"
                >
                  {{ t('teleskop.elapsed-time') }}
                </q-tooltip>
              </span>
            </div>
          </div>
        </div>

        <div
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
          :class="
            machine.runningAlarmName === ''
              ? 'text-white'
              : machine.currentAlarmStatus === AlarmStatus.NEW
                ? 'alarm'
                : machine.currentAlarmStatus === AlarmStatus.CONFIRMED
                  ? 'text-green-400'
                  : 'text-white'
          "
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t('teleskop.alarm-second') }}
          </q-tooltip>

          <div class="explanation">
            {{ t('teleskop.alarm-second') }}
          </div>
          <q-separator
            color="white"
            vertical
            class="h-full"
            spaced
          />

          <div class="flex-center w-full">
            {{ machine.runningAlarmName }}
          </div>
        </div>

        <div
          v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
          class="machine-commands_items justify-center"
          :style="{ background: cardColors.itemBackGround, color: determineTextColor(cardColors.itemBackGround) }"
        >
          <div
            v-show="isMachineRunning && machine.reqOrderIndex !== -1"
            class="overflow-hidden"
            :class="infoTextColor"
          >
            <span>{{ t('teleskop.order-index') }} - {{ machine.reqOrderIndex }}</span>
            |
            <span>{{ t('teleskop.target-recipe') }} - {{ machine.reqTargetRecipe }}</span>
            |
            <span>{{ t('teleskop.tank-no') }} - {{ machine.reqTankNo }}</span>
            |
            <span>{{ t('teleskop.program-no') }} - {{ machine.reqProgramNo }}</span>
            |
            <span>{{ t('teleskop.req-status') }} - {{ reqStatus(machine.reqStatus) }}</span>
          </div>
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
            :delay="300"
            :hide-delay="300"
          >
            <MachineCardInfoTooltip
              :plan-key="machine.runningPlankey"
              :program-no="machine.reqProgramNo"
              :recipe-index="machine.reqOrderIndex"
            />
          </q-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.card-wrapper {
  @apply w-full;
}

.card-container {
  border-radius: 20px;
  @apply flex flex-col w-full h-full;

  .command-title {
    border-radius: 15px 15px 0 0;
    @apply h-5 flex flex-row-reverse justify-evenly px-3 text-center items-center;
  }

  .card-items {
    @apply flex flex-row-reverse justify-evenly text-center;
    .card-items__item {
      @apply border-1 border-black w-full;
    }
  }

  .machine-info {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
    grid-template-rows: 1fr;
    @apply relative grid w-full px-2 items-center justify-center content-center justify-items-stretch;

    .machine-icons {
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      grid-template-rows: 1fr;
      @apply grid self-center justify-evenly gap-2px;

      :is(img) {
        @apply w-10 h-10;
      }
    }

    .thermometer {
      border-radius: 25px;
      @apply relative w-auto h-full max-w-25 max-h-35px flex items-center justify-center text-2xl;
    }
  }

  .machine-commands {
    @apply relative flex flex-col gap-2px h-full justify-end mb-1 mx-1;

    .explanation {
      @apply ml-2 w-25 min-w-25 text-center;
    }

    .machine-commands_items {
      @apply w-full h-7 flex text-center items-center rounded-2xl overflow-hidden whitespace-nowrap;
    }
  }
}

.alarm {
  animation: alarm 10s ease-out infinite;
  transform: translate3d(0);
}

@keyframes alarm {
  0%,
  1%,
  2%,
  3%,
  4% {
    color: rgba(255, 255, 255, 0);
  }

  1.5%,
  2.5%,
  3.5%,
  4.5%,
  100% {
    color: rgba(255, 255, 255, 1);
  }
}
</style>
