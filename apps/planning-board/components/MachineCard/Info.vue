<script setup lang="ts">
import { determineTextColor } from 'utils/src/color'
import type { MachineData } from '~/shared/types'

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
withDefaults(defineProps<CardInfoProps>(), {
  washing: false,
})
const { t } = useI18n()
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
  <div v-if="machineSort !== 5" class="machine-commands">
    <!-- ERP DROPDOWN -->
    <div
      v-show="machine.runningBatchStatus === 2"
      class="machine-commands_items justify-center"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <div class="explanation">
        ERP
      </div>
      <q-separator color="white" vertical class="h-full" spaced />
      <MachineCardSettings :data="machine" />
    </div>
    <!-- PROG ID/NAME -->
    <div
      v-show="machine.runningBatchStatus === 2"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("machine-card.program-name") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("machine-card.program-name") }}
      </div>
      <q-separator color="white" vertical class="h-full" spaced />

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
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("machine-card.phase") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("machine-card.phase") }}
      </div>
      <q-separator color="white" vertical class="h-full" spaced />

      <span class="flex-center w-full">
        {{ machine.runningPhaseNo }}
        <span v-show="machine.runningPhaseName !== ' '">&nbsp;|&nbsp;</span>
        {{ machine.runningPhaseName }}
      </span>
    </div>
    <!-- STEP NO / COMMAND NO / COMMAND NAME -->
    <div
      v-show="machine.runningBatchStatus === 2"
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("machine-card.command") }}
      </q-tooltip>

      <div class="explanation">
        <!-- {{ t("machine-card.command") }} -->
        {{ t("machine-card.command-info") }}
      </div>
      <q-separator color="white" vertical class="h-full" spaced />

      <span class="flex-center w-full">
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
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <q-tooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("machine-card.stop-reason") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("machine-card.stop-reason") }}
      </div>
      <q-separator color="white" vertical class="h-full" spaced />
      <div class="flex-center w-full">
        <span>{{ machine.manualReason }}</span>
        <span>{{ machine.stopReason }}</span>
        <span v-show="machine.connectionStatus === 2" class="text-red-700">
          {{ t("machine-card.no-connection") }}
        </span>
      </div>
    </div>
    <div
      class="machine-commands_items"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
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

      <div class="explanation">
        {{ t("machine-card.alarm-second") }}
      </div>
      <q-separator color="white" vertical class="h-full" spaced />

      <div class="flex-center w-full">
        <!-- {{ machine.runningAlarmNo }} -->
        <!-- <span v-show="machine.runningAlarmName !== ' '">&nbsp;|&nbsp;</span> -->
        {{ machine.runningAlarmName }}
      </div>
    </div>
    <div
      v-show="machine.runningBatchStatus === 2"
      class="machine-commands_items justify-center"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
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
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      {{ machine.name }}
    </div>
    <div v-if="machine.connectionStatus === 1">
      <div
        class="machine-commands_items min-h-20 text-center justify-center text-2xl alarm"
        :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
      >
        {{ machine.runningAlarmNo }}
        <span v-show="machine.runningAlarmName !== ' '">&nbsp;|&nbsp;</span>
        {{ machine.runningAlarmName }}
      </div>
    </div>
    <div
      v-else
      class="machine-commands_items min-h-20 text-center justify-center text-2xl alarm"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      {{ t('machine-card.no-connection') }}
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
