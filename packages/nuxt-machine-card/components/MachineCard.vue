<script setup lang="ts">
import { color } from 'd3'
import { withBase } from 'ufo'
import type { MachineCardData } from '../types'

interface MachineCardProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  machine: MachineCardData
  isGroupVisible: boolean
  isScreenViable: boolean
  machineSort: number
  washing?: boolean
  linksActive?: boolean
}
withDefaults(defineProps<MachineCardProps>(), {
  washing: false,
})
function textColor(bgColor: string) {
  const colorToRGB = color(bgColor)!.rgb()
  const sRGB = {
    r: colorToRGB.r / 255,
    g: colorToRGB.g / 255,
    b: colorToRGB.b / 255,
  }
  function sRGBtoLin(colorChannel: number) {
    if (colorChannel <= 0.04045) {
      return colorChannel / 12.92
    } else {
      return ((colorChannel + 0.055) / 1.055) ** 2.4
    }
  }
  return (0.2126 * sRGBtoLin(sRGB.r) + 0.7152 * sRGBtoLin(sRGB.g) + 0.0722 * sRGBtoLin(sRGB.b)) > 0.5 ? 'black' : 'white'
}
const { t } = useI18n()
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
    return withBaseURL('/icons/baglanti-sorunlu.png')
  }
}

function reqStatus(params: number) {
  if (params === 0) {
    return t('machine-card.status-new')
  } else if (params === 1) {
    return t('machine-card.status-sent')
  } else if (params === 2) {
    return t('machine-card.status-finished')
  } else if (params === 4) {
    return t('machine-card.status-prio')
  } else return t('machine-card.status-cancelled')
}
</script>

<template>
  <div
    class="card-container"
    :style="{ background: colors.backGround, color: textColor(colors.backGround) }"
  >
    <div class="command-title p-1" :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }">
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
        <span v-if="isGroupVisible"> {{ machine.groupName }} &nbsp; </span>
        {{ machine.loggedInOperatorName }}
      </div>
      <NuxtLink :to="isScreenViable ? '/' : `vnc/${machine.id}`" :target="isScreenViable ? '_self' : '_blank'">
        <span
          class="flex w-min whitespace-nowrap text-left"
          :class="
            isScreenViable
              ? 'cursor-not-allowed opacity-70'
              : 'cursor-pointer hover:(underline text-white)'
          "
        >
          {{ machine.name }}
        </span>
      </NuxtLink>
    </div>
    <div class="card-items justify-center">
      <span class="card-items__item">{{ machine.runningStartHour }}</span>
      <NuxtLink
        :to="machine.runningBatchStatus !== 0 && linksActive ? `/details/${machine.id}` : '/'"
        class="card-items__item hover:underline hover:text-shadow-lg"
        :class="machine.runningBatchStatus !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
      >
        <span>
          {{ machine.runningJobOrder }}
        </span>
      </NuxtLink>
    </div>
    <div class="machine-info">
      <div class="thermometer" :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }">
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
          <MachineProgressBar
            :data="machine"
            :completition-ratio="(machine.elapsedTime! / machine.theoreticalDuration!) * 100"
          />
        </div>
      </div>
      <!-- ICONS -->
      <div class="machine-icons">
        <img
          v-if="machine.runningBatchStatus !== 0"
          :src="
            machine.runningBatchStatus === 1
              ? withBaseURL('/icons/is-emri-off.png')
              : withBaseURL('/icons/is-emri-on.png')
          "
        >
        <img :src="connectionStatus(machine.connectionStatus)">
        <img
          v-if="machine.autoManualStatus === 0"
          src="/icons/auto.png"
          alt=""
        >
        <img v-if="machine.autoManualStatus === 1" src="/icons/manual.png">
        <img
          v-if="machine.isSynchronizing === true"
          src="/icons/bilgi-esitleme.png"
        >
      </div>
    </div>
    <!-- MACHINE INFO -->
    <div v-if="machineSort !== 5" class="machine-commands">
      <!-- ERP DROPDOWN -->
      <div
        v-show="machine.runningBatchStatus === 2"
        class="machine-commands_items justify-center"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <MachineSettings :data="machine" />
      </div>
      <!-- PROG ID/NAME -->
      <div
        v-show="machine.runningBatchStatus === 2"
        class="machine-commands_items"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <q-tooltip
          transition-show="scale"
          class="text-black e-border bg-white"
          :offset="[3, 3]"
        >
          {{ t("machine-card.program-name") }}
        </q-tooltip>
        <span
          class="w-full overflow-hidden"
          :class="
            machine.runningProgramName.length > 70
              ? 'justify-start'
              : 'justify-center'
          "
        >
          {{ machine.runningProgramId }}
          <span v-show="machine.runningProgramName !== ' '">&nbsp;|&nbsp;</span>
          {{ machine.runningProgramName }}
        </span>
      </div>
      <!-- PHASE NO/NAME ONLY FOR WASHING -->
      <div
        v-if="washing"
        v-show="machine.runningBatchStatus === 2"
        :class="
          machine.runningProgramName.length > 50
            ? 'justify-start'
            : 'justify-center'
        "
        class="machine-commands_items gap-3"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <q-tooltip
          transition-show="scale"
          class="text-black e-border bg-white"
          :offset="[3, 3]"
        >
          {{ t("machine-card.phase") }}
        </q-tooltip>
        <span>
          {{ machine.runningPhaseNo }}
          <span v-show="machine.runningPhaseName !== ' '">&nbsp;|&nbsp;</span>
          {{ machine.runningPhaseName }}
        </span>
      </div>
      <!-- STEP NO / COMMAND NO / COMMAND NAME -->
      <div
        v-show="machine.runningBatchStatus === 2"
        class="machine-commands_items justify-center"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <q-tooltip
          transition-show="scale"
          class="text-black e-border bg-white"
          :offset="[3, 3]"
        >
          {{ t("machine-card.command") }}
        </q-tooltip>
        <span>
          {{ machine.runningStepNo }}
          <span v-show="machine.runningCommandNo !== null">
            &nbsp;-&nbsp;
          </span>
          {{ machine.runningCommandNo }}
          <span v-show="machine.runningCommandName !== ' '">
            &nbsp;-&nbsp;
          </span>
          {{ machine.runningCommandName }}
        </span>
      </div>
      <!-- STOP REASON (IF THERES ANY) -->
      <div
        class="machine-commands_items justify-center gap-1"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <q-tooltip
          transition-show="scale"
          class="text-black e-border bg-white"
          :offset="[3, 3]"
        >
          {{ t("machine-card.stop-reason") }}
        </q-tooltip>
        <span>{{ machine.manualReason }}</span>
        <span>{{ machine.stopReason }}</span>
        <span v-show="machine.connectionStatus === 2" class="text-red-700">
          {{ t("machine-card.no-connection") }}
        </span>
      </div>
      <div
        class="machine-commands_items justify-center"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
        :class="
          machine.runningAlarmName === ' '
            ? 'text-white'
            : machine.currentAlarmStatus === 0
              ? 'alarm'
              : machine.currentAlarmStatus === 1
                ? 'text-green-400'
                : 'text-white'
        "
      >
        <q-tooltip
          transition-show="scale"
          class="text-black e-border bg-white"
          :offset="[3, 3]"
        >
          {{ t("machine-card.alarm-second") }}
        </q-tooltip>
        {{ machine.runningAlarmNo }}
        <span v-show="machine.runningAlarmName !== ' '">&nbsp;|&nbsp;</span>
        {{ machine.runningAlarmName }}
      </div>
      <div
        v-show="machine.runningBatchStatus === 2"
        class="machine-commands_items justify-center"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        <div v-show="machine.reqOrderIndex !== -1" class="overflow-hidden">
          <span>{{ t("machine-card.order-index") }} - {{ machine.reqOrderIndex }}
          </span>
          |
          <span>{{ t("machine-card.target-recipe") }} -
            {{ machine.reqTargetRecipe }}</span>
          <!--  0 kimyasal 1 boya 2 tuz 4 jenerik materyal 1 5 jenerik 2  -->
          |
          <span>{{ t("machine-card.tank-no") }} - {{ machine.reqTankNo }}</span>
          |
          <span>{{ t("machine-card.program-no") }} - {{ machine.reqProgramNo }}</span>
          |
          <span>{{ t("machine-card.req-status") }} -
            {{ reqStatus(machine.reqStatus) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="machine-commands !gap-2">
      <div
        class="machine-commands_items min-h-20 text-center justify-center text-4xl"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        {{ machine.name }}
      </div>
      <div v-if="machine.connectionStatus === 1">
        <div
          class="machine-commands_items min-h-20 text-center justify-center text-2xl alarm"
          :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
        >
          {{ machine.runningAlarmNo }}
          <span v-show="machine.runningAlarmName !== ' '">&nbsp;|&nbsp;</span>
          {{ machine.runningAlarmName }}
        </div>
      </div>
      <div
        v-else
        class="machine-commands_items min-h-20 text-center justify-center text-2xl alarm"
        :style="{ background: colors.itemBackGround, color: textColor(colors.itemBackGround) }"
      >
        {{ t('machine-card.no-connection') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
  .card-container {
    border-radius: 20px;
    @apply flex flex-col e-border border-dark-900/10 w-full h-full;
    .icons {
      @apply w-7 h-7 p-3px;
    }
    .command-title {
      border-radius: 15px 15px 0 0;
      @apply h-5 flex flex-row-reverse justify-evenly px-3 text-center items-center;
    }
    .card-items {
      @apply flex flex-row-reverse justify-evenly text-center;
      .card-items__item {
        @apply e-border border-black w-full;
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
        @apply relative w-auto bg-black h-full max-w-25 max-h-35px flex  items-center justify-center text-2xl;
      }
    }

    .machine-commands {
      @apply relative flex flex-col gap-2px px-1 mb-1 h-full justify-end;
      .machine-commands_items {
        @apply w-full h-7 flex text-center items-center rounded-2xl overflow-hidden whitespace-nowrap text-white;
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
