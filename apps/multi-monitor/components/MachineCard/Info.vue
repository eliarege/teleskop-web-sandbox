<script setup lang="ts">
import { determineTextColor, formatDuration } from '@teleskop/utils'
import { useStorage } from '@vueuse/core'
import { AlarmStatus, AutoManualStatus, BatchStatus, ConnectionStatus, RequestStatus } from '~/shared/enums'
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

interface CardInfoProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  machine: MachineData
  machineSort: number
  washing?: boolean
}

const props = withDefaults(defineProps<CardInfoProps>(), {
  washing: false,
})

const { t } = useI18n()
const store = useDataStore()
const erpKey = computed(() => store.erpKeys.find(e => e.id === props.machine.id)?.key || '')
// The status of the last request. (0 new- 1 send to the dispenser - 2 Dispenser started - 3 Completed - 8 Cancelled)
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
  } else return t('teleskop.status-cancelled')
}

const stopReasonElapsedTime = computed(() => {
  if (props.machine.stopReasonDateTime === null)
    return ''
  const givenDate = new Date(props.machine.stopReasonDateTime)
  const elapsed = Date.now() - givenDate.getTime()
  return formatDuration(elapsed)
})

const manualReasonElapsedTime = computed(() => {
  if (props.machine.manualReasonDateTime === null)
    return ''
  const givenDate = new Date(props.machine.manualReasonDateTime)
  const elapsed = Date.now() - givenDate.getTime()
  return formatDuration(elapsed)
})

const infoTextColor = computed(() => {
  if (props.machine.reqStatus === RequestStatus.FINISHED)
    return 'text-green-500'
  if (props.machine.reqStatus === RequestStatus.CANCELLED)
    return 'text-red-500'
  return ''
})
</script>

<template>
  <div class="machine-commands">
    <!-- BAĞLANTI YOK UYARISI - Bağlantı yoksa sadece bunu göster -->
    <div v-if="machine.connectionStatus === ConnectionStatus.NOTCONNECTED" class="w-full h-full gap-2 flex-center text-red text-4xl">
      <TwIcon
        name="i-mdi:wifi-off"
        size="36px"
        color="#ef4444"
      />
      {{ t('teleskop.no-connection') }}
    </div>

    <!-- ERP DROPDOWN -->
    <div
      v-show="machine.runningBatchStatus === BatchStatus.RUNNING && machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items justify-center"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <div class="explanation">
        <!-- {{ mt(erpKey, machine.id) }} -->
        {{ erpKey }}
      </div>
      <q-separator
        color="white"
        vertical
        class="h-full"
        spaced
      />
      <MachineCardSettings :data="machine" />
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ erpKey || 'ERP' }}
      </q-tooltip>
    </div>
    <!-- PROG ID/NAME -->
    <MachineCardInfoProgressBar
      v-show="machine.runningBatchStatus === BatchStatus.RUNNING && machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      :data="machine"
    >
      <div class="absolute w-full h-full flex items-center flex-nowrap whitespace-nowrap overflow-hidden top-0 left-0">
        <div class="explanation">
          {{ t("teleskop.program-name") }}
        </div>
        <q-separator
          color="white"
          vertical
          class="h-full"
          spaced
        />

        <span
          class="overflow-hidden"
          :class="
            machine.runningProgramName.length > 70
              ? 'justify-start'
              : 'justify-center'
          "
        >
          {{ machine.runningProgramId }}
          <span v-show="machine.runningProgramName">&nbsp;|&nbsp;</span>
          {{ machine.runningProgramName }}
        </span>
      </div>
    </MachineCardInfoProgressBar>
    <!-- PHASE NO/NAME ONLY FOR WASHING -->
    <div
      v-if="washing"
      v-show="machine.runningBatchStatus === BatchStatus.RUNNING && machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.phase") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("teleskop.phase") }}
      </div>
      <q-separator
        color="white"
        vertical
        class="h-full"
        spaced
      />

      <span class="flex-center w-full">
        {{ machine.runningPhaseNo }}
        <span v-show="machine.runningPhaseName">&nbsp;|&nbsp;</span>
        {{ machine.runningPhaseName }}
      </span>
    </div>
    <!-- STEP NO / COMMAND NO / COMMAND NAME -->
    <div
      v-show="machine.runningBatchStatus === BatchStatus.RUNNING && machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.command") }}
      </q-tooltip>

      <div class="explanation">
        <!-- {{ t("teleskop.command") }} -->
        {{ t("teleskop.command-info") }}
      </div>
      <q-separator
        color="white"
        vertical
        class="h-full"
        spaced
      />

      <span class="flex-center w-full">
        {{ machine.runningStepNo }}
        <span v-show="machine.runningCommandNo !== null">
          &nbsp;-&nbsp;
        </span>
        {{ machine.runningCommandNo }}
        <span v-show="machine.runningCommandName">
          &nbsp;-&nbsp;
        </span>
        {{ machine.runningCommandName }}
      </span>
    </div>
    <!-- STOP REASON (IF THERES ANY) - Gizle bağlantı yoksa -->
    <div
      v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        v-if="machine.stopReason"
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.stop-reason") }}
      </q-tooltip>
      <!-- machine.runningBatchStatus === 1 ise makine duruş -->
      <div class="explanation">
        <span v-if="machine.autoManualStatus">
          {{ t("teleskop.manual-reason") }}
        </span>
        <span v-else>
          {{ t("teleskop.stop-reason") }}
        </span>
      </div>
      <q-separator
        color="white"
        vertical
        class="h-full"
        spaced
      />
      <!-- machine.autoManualStatus === 1 ise makine manuelde -->
      <div class="flex-center w-full">
        <div v-if="machine.autoManualStatus" class="flex-center gap-3">
          <span>{{ machine.manualReason }}</span>
          <span>
            {{ manualReasonElapsedTime }} &nbsp;
            <q-tooltip
              v-if="machine.manualReason"
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
          <span> {{ stopReasonElapsedTime }} &nbsp;
            <q-tooltip
              v-if="stopReasonElapsedTime"
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
    <!-- ALARM - Gizle bağlantı yoksa -->
    <div
      v-show="machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
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
        {{ t("teleskop.alarm-second") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("teleskop.alarm-second") }}
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
      v-show="machine.runningBatchStatus === BatchStatus.RUNNING && machine.connectionStatus !== ConnectionStatus.NOTCONNECTED"
      class="machine-commands_items justify-center"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <div
        v-show="machine.reqOrderIndex !== -1"
        class="overflow-hidden"
        :class="infoTextColor"
      >
        <span>{{ t("teleskop.order-index") }} - {{ machine.reqOrderIndex }}</span>
        |
        <span>{{ t("teleskop.target-recipe") }} - {{ machine.reqTargetRecipe }}</span>
        <!--  0 kimyasal 1 boya 2 tuz 4 jenerik materyal 1 5 jenerik 2  -->
        |
        <span>{{ t("teleskop.tank-no") }} - {{ machine.reqTankNo }}</span>
        |
        <span>{{ t("teleskop.program-no") }} - {{ machine.reqProgramNo }}</span>
        |
        <span>{{ t("teleskop.req-status") }} - {{ reqStatus(machine.reqStatus) }}</span>
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
</template>

<style scoped lang="postcss">
.info-item {
  @apply flex items-center gap-1;
}

.info-divider {
  @apply w-px h-3 bg-gray-300;
}

.status-dot {
  @apply w-1.5 h-1.5 rounded-full;
}

.status-offline {
  @apply bg-red-500;
}

.status-last {
  @apply bg-gray-400;
}

.info-text {
  @apply text-gray-700;
}
</style>
