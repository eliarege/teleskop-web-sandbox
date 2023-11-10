<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'
import { useColorStore } from '~/store/Colors'

const props = defineProps({
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})
const { t } = useI18n()
const store = useDataStore()
const colors = useColorStore()
const sortedMachines = computed(() => {
  const filteredMachines = props.machineData.filter(item => !store.filteredMachines.has(item.id))
  const activeSort = filteredMachines.filter(
    machine => machine.runningBatchStatus !== 0,
  )
  const inactiveSort = filteredMachines.filter(
    machine => machine.runningBatchStatus === 0,
  )
  if (store.sortMachines === 3) {
    return [
      ...inactiveSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
      ...activeSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
    ]
  } else if (store.sortMachines === 2) {
    return [
      ...activeSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
      ...inactiveSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
    ]
  } else if (store.sortMachines === 4) {
    return [...filteredMachines].sort((a, b) => a.groupName < b.groupName ? -1 : 1,
    )
  } else if (store.sortMachines === 5) {
    return filteredMachines.filter(alarm => alarm.currentAlarmStatus !== 2).sort((a, b) => a.currentAlarmStatus > b.currentAlarmStatus ? 1 : -1)
  } else {
    return [...filteredMachines].sort((a, b) => (a.id < b.id ? -1 : 1))
  }
})
// machine connection
function connectionStatus(params: number) {
  if (params === 1) {
    return '/icons/baglanti-var.png'
  } else if (params === 2) {
    return '/icons/baglanti-yok.png'
  } else if (params === 5) {
    return '/icons/batarya.png'
  } else {
    return '/icons/baglanti-sorunlu.png'
  }
}
function reqStatus(params: number) {
  if (params === 0) {
    return t('teleskop.status-new')
  } else if (params === 1) {
    return t('teleskop.status-sent')
  } else if (params === 2) {
    return t('teleskop.status-finished')
  } else if (params === 4) {
    return t('teleskop.status-prio')
  } else return t('teleskop.status-cancelled')
}
const { width: screenWidth } = useWindowSize()
function cardBackgroundColor(currentAlarmStatus: number, runningBatchStatus: number) {
  if (store.sortMachines === 5) {
    if (currentAlarmStatus === 0) {
      return '#FF3030'
    } else if (currentAlarmStatus === 1) {
      return '#FFA730'
    }
  }
  if (runningBatchStatus !== 2) {
    return colors.cardIdleBg
  } else return colors.cardActiveBg
}
///////
</script>

<template>
  <div class="cardwrapper" :class="store.mode === false ? 'ml-25' : ''">
    <div
      v-for="element in sortedMachines"
      :key="element.id"
      class="cards"
      :style="{ background: cardBackgroundColor(element.currentAlarmStatus, element.runningBatchStatus) }"
    >
      <div class="commandtitle p-1" :style="{ background: colors.cardItemBg }">
        <div class="ml-3">
          <q-tooltip
            transition-show="scale"
            class="text-black bg-white"
            :offset="[3, 3]"
          >
            {{ element.machineIpAddress }}
          </q-tooltip>
          {{ element.id }}
        </div>
        <div class="w-full flex justify-end">
          <span v-if="store.group"> {{ element.groupName }} &nbsp; </span>
          {{ element.loggedInOperatorName }}
        </div>
        <NuxtLink :to="screenWidth < 900 ? '/' : `vnc/${element.id}`" :target="screenWidth < 900 ? '_self' : '_blank'">
          <span
            class="flex w-min whitespace-nowrap text-left"
            :class="
              screenWidth < 900
                ? 'cursor-not-allowed opacity-70'
                : 'cursor-pointer hover:(underline text-white)'
            "
          >
            {{ element.name }}
          </span>
        </NuxtLink>
      </div>
      <div class="items justify-center">
        <span class="item">{{ element.runningStartHour }}</span>
        <NuxtLink
          :to="element.runningBatchStatus !== 0 ? `/details/${element.id}` : '/'"
          class="item hover:underline hover:text-shadow-lg"
          :class="element.runningBatchStatus !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          <span>
            {{ element.runningJobOrder }}
          </span>
        </NuxtLink>
      </div>
      <div class="machine-info">
        <div class="temp" :style="{ background: colors.cardItemBg }">
          <Icon
            icon="jam:temperature"
            color="orange"
            :inline="true"
          />
          {{ Math.round(element.currentTemperature) }}C°
        </div>
        <div>
          <div
            class="relative w-25"
            :class="element.runningStepNo === 0 ? 'invisible' : 'visible'"
          >
            <ProgressBar
              :data="element"
              :completition-ratio="(element.elapsedTime! / element.theoreticalDuration!) * 100"
            />
          </div>
        </div>

        <!-- ICONS -->

        <div class="machine-icons">
          <img
            v-if="element.runningBatchStatus !== 0"
            :src="
              element.runningBatchStatus === 1
                ? '/icons/is-emri-off.png'
                : '/icons/is-emri-on.png'
            "
          >
          <img :src="connectionStatus(element.connectionStatus)" alt="">
          <img
            v-if="element.autoManualStatus === 0"
            src="icons/auto.png"
            alt=""
          >
          <img v-if="element.autoManualStatus === 1" src="/icons/manual.png">
          <img
            v-if="element.isSynchronizing === true"
            src="/icons/bilgi-esitleme.png"
          >
        </div>
      </div>

      <!-- MACHINE INFO -->

      <div v-if="store.sortMachines !== 5" class="commands">
        <!-- ERP DROPDOWN -->
        <div
          v-show="element.runningBatchStatus === 2"
          class="commanditems justify-center"
          :style="{ background: colors.cardItemBg }"
        >
          <MachineSettings :data="element" />
        </div>
        <!-- PROG ID/NAME -->
        <div
          v-show="element.runningBatchStatus === 2"
          class="commanditems"
          :style="{ background: colors.cardItemBg }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t("teleskop.program-name") }}
          </q-tooltip>
          <span
            class="w-full overflow-hidden"
            :class="
              element.runningProgramName.length > 70
                ? 'justify-start'
                : 'justify-center'
            "
          >
            {{ element.runningProgramId }}
            <span v-show="element.runningProgramName !== ' '">&nbsp;|&nbsp;</span>
            {{ element.runningProgramName }}
          </span>
        </div>
        <!-- PHASE NO/NAME ONLY FOR WASHING -->
        <div
          v-if="store.settings !== '0'"
          v-show="element.runningBatchStatus === 2"
          :class="
            element.runningProgramName.length > 50
              ? 'justify-start'
              : 'justify-center'
          "
          class="commanditems gap-3"
          :style="{ background: colors.cardItemBg }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t("teleskop.phase") }}
          </q-tooltip>
          <span>
            {{ element.runningPhaseNo }}
            <span v-show="element.runningPhaseName !== ' '">&nbsp;|&nbsp;</span>
            {{ element.runningPhaseName }}
          </span>
        </div>
        <!-- STEP NO / COMMAND NO / COMMAND NAME -->
        <div
          v-show="element.runningBatchStatus === 2"
          class="commanditems justify-center"
          :style="{ background: colors.cardItemBg }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t("teleskop.command") }}
          </q-tooltip>
          <span>
            {{ element.runningStepNo }}
            <span v-show="element.runningCommandNo !== null">
              &nbsp;-&nbsp;
            </span>
            {{ element.runningCommandNo }}
            <span v-show="element.runningCommandName !== ' '">
              &nbsp;-&nbsp;
            </span>
            {{ element.runningCommandName }}
          </span>
        </div>
        <!-- STOP REASON (IF THERES ANY) -->
        <div
          class="commanditems justify-center gap-1"
          :style="{ background: colors.cardItemBg }"
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t("teleskop.stop-reason") }}
          </q-tooltip>
          <span>{{ element.manualReason }}</span>
          <span>{{ element.stopReason }}</span>
          <span v-show="element.connectionStatus === 2" class="text-red-700">
            {{ t("teleskop.no-connection") }}
          </span>
        </div>
        <div
          class="commanditems justify-center"
          :style="{ background: colors.cardItemBg }"
          :class="
            element.runningAlarmName === ' '
              ? 'text-white'
              : element.currentAlarmStatus === 0
                ? 'alarm'
                : element.currentAlarmStatus === 1
                  ? 'text-green-400'
                  : 'text-white'
          "
        >
          <q-tooltip
            transition-show="scale"
            class="text-black e-border bg-white"
            :offset="[3, 3]"
          >
            {{ t("teleskop.alarm-second") }}
          </q-tooltip>
          {{ element.runningAlarmNo }}
          <span v-show="element.runningAlarmName !== ' '">&nbsp;|&nbsp;</span>
          {{ element.runningAlarmName }}
        </div>
        <div
          v-show="element.runningBatchStatus === 2"
          class="commanditems justify-center"
          :style="{ background: colors.cardItemBg }"
        >
          <div v-show="element.reqOrderIndex !== -1" class="overflow-hidden">
            <span>{{ t("teleskop.order-index") }} - {{ element.reqOrderIndex }}
            </span>
            |
            <span>{{ t("teleskop.target-recipe") }} -
              {{ element.reqTargetRecipe }}</span>
            <!--  0 kimyasal 1 boya 2 tuz 4 jenerik materyal 1 5 jenerik 2  -->
            |
            <span>{{ t("teleskop.tank-no") }} - {{ element.reqTankNo }}</span>
            |
            <span>{{ t("teleskop.program-no") }} - {{ element.reqProgramNo }}</span>
            |
            <span>{{ t("teleskop.req-status") }} -
              {{ reqStatus(element.reqStatus) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="commands !gap-2">
        <div
          class="commanditems min-h-20 text-center justify-center text-4xl"
          :style="{ background: colors.cardItemBg }"
        >
          {{ element.name }}
        </div>
        <div v-if="element.connectionStatus === 1">
          <div
            class="commanditems min-h-20 text-center justify-center text-2xl alarm"
            :style="{ background: colors.cardItemBg }"
          >
            {{ element.runningAlarmNo }}
            <span v-show="element.runningAlarmName !== ' '">&nbsp;|&nbsp;</span>
            {{ element.runningAlarmName }}
          </div>
        </div>
        <div
          v-else
          class="commanditems min-h-20 text-center justify-center text-2xl alarm"
          :style="{ background: colors.cardItemBg }"
        >
          {{ t('teleskop.no-connection') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
* {
  transform: translate3d(0, 0, 0);
}
.cardwrapper {
  grid-template-columns: repeat(auto-fill, minmax(370px, 1fr));
  grid-auto-rows: repeat(auto-fill, minmax(370px, 1fr));
  @apply grid gap-x-3 gap-y-2 mt-1 mb-3 overflow-x-hidden font-extrabold;
  .cards {
    border-radius: 20px;
    @apply flex flex-col e-border border-dark-900/10;
    .icons {
      @apply w-7 h-7 p-3px;
    }
    .commandtitle {
      border-radius: 15px 15px 0 0;
      @apply h-5 flex flex-row-reverse justify-evenly px-3 text-center items-center;
    }
    .items {
      @apply flex flex-row-reverse justify-evenly text-center;
      .item {
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
      .temp {
        border-radius: 25px;
        @apply relative w-auto bg-black h-full max-w-25 max-h-35px flex  items-center justify-center text-2xl;
      }
    }

    .commands {
      @apply relative flex flex-col gap-2px px-1 mb-1 h-full justify-end;
      .commanditems {
        @apply w-full h-7 flex text-center items-center rounded-2xl overflow-hidden whitespace-nowrap text-white;
      }
    }
  }
}
@media screen and (max-width: 735px) {
  .cardwrapper {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: repeat(auto-fill, minmax(300px, 1fr));
    @apply mt-6 ml-0;
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
