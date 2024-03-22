<script setup lang="ts">
import { determineTextColor } from 'utils/src/color'
import type { MachineData } from '~/shared/types'

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
defineProps<CardTitleProps>()
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
      :to="machine.runningBatchStatus !== 0 ? `/details/${machine.id}` : '/'"
      class="card-items__item hover:underline hover:text-shadow-lg"
      :class="machine.runningBatchStatus !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
    >
      <span>
        {{ machine.runningJobOrder }}
      </span>
    </NuxtLink>
  </div>
</template>
