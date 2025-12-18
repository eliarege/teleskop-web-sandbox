<script setup lang="ts">
import { determineTextColor } from '@teleskop/utils'
import type { MachineData } from '~/shared/types'
import { BatchStatus } from '~/shared/enums'

interface CardTitleProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  machine: MachineData
  isGroupVisible: boolean
  isScreenViable: boolean
}
const props = defineProps<CardTitleProps>()
const router = useRouter()

function handleRouting(batchStatus: number, id: number) {
  if (batchStatus !== BatchStatus.IDLE) {
    navigateTo(`/details/${id}`)
  }
}
</script>

<template>
  <div class="command-title p-1" :style="{ background: colors.itemBackGround, color: determineTextColor(colors.itemBackGround) }">
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
    <span class="flex w-min whitespace-nowrap text-left">
      {{ machine.name }}
    </span>
  </div>
  <div class="card-items justify-center">
    <span class="card-items__item">{{ machine.runningStartHour }}</span>
    <div
      class="card-items__item"
    >
      <span>
        {{ machine.runningJobOrder }}
      </span>
    </div>
  </div>
</template>
