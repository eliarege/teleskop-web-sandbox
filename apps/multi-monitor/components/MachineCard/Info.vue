<script setup lang="ts">
import { determineTextColor } from '@teleskop/utils'
import { useStorage } from '@vueuse/core'
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
const props = withDefaults(defineProps<CardInfoProps>(), {
  washing: false,
})
const { t } = useI18n()
const { mt } = useMachineTranslations()

const erpKey = useStorage<string | null>(
  `machine-${props.machine.id}-settings`,
  'Kilo',
  localStorage,
)
// The status of the last request. (0 new- 1 send to the dispenser - 2 Dispenser started - 3 Completed - 8 Cancelled)
function reqStatus(params: number) {
  if (params === 0) {
    return t('teleskop.status-new')
  } else if (params === 1) {
    return t('teleskop.status-sent')
  } else if (params === 2) {
    return t('teleskop.status-started')
  } else if (params === 3) {
    return t('teleskop.status-finished')
  } else if (params === 4) {
    return t('teleskop.status-prio')
  } else return t('teleskop.status-cancelled')
}
</script>

<template>
  <div class="machine-commands">
    <!-- ERP DROPDOWN -->
    <div
      v-show="machine.runningBatchStatus === 2"
      class="machine-commands_items justify-center"
      :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }"
    >
      <div class="explanation">
        {{ mt(erpKey, machine.id) || 'Kilo' }}
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
      v-show="machine.runningBatchStatus === 2"
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
          <span v-show="machine.runningProgramName !== ' '">&nbsp;|&nbsp;</span>
          {{ machine.runningProgramName }}
        </span>
      </div>
    </MachineCardInfoProgressBar>
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
        {{ t("teleskop.stop-reason") }}
      </q-tooltip>

      <div class="explanation">
        {{ t("teleskop.stop-reason") }}
      </div>
      <q-separator
        color="white"
        vertical
        class="h-full"
        spaced
      />
      <div class="flex-center w-full">
        <span>{{ machine.manualReason }}</span>
        <span>{{ machine.stopReason }}</span>
        <span v-show="machine.connectionStatus === 2" class="text-red-700">
          {{ t("teleskop.no-connection") }}
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
        <span>{{ t("teleskop.order-index") }} - {{ machine.reqOrderIndex }}
        </span>
        |
        <span>{{ t("teleskop.target-recipe") }} -
          {{ machine.reqTargetRecipe }}</span>
        <!--  0 kimyasal 1 boya 2 tuz 4 jenerik materyal 1 5 jenerik 2  -->
        |
        <span>{{ t("teleskop.tank-no") }} - {{ machine.reqTankNo }}</span>
        |
        <span>{{ t("teleskop.program-no") }} - {{ machine.reqProgramNo }}</span>
        |
        <span>{{ t("teleskop.req-status") }} -
          {{ reqStatus(machine.reqStatus) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
