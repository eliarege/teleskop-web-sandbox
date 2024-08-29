<script setup lang="ts">
import { determineTextColor } from '@teleskop/utils'
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
const props = defineProps<CardTitleProps>()
const router = useRouter()
const keycloak = useKeycloak()

const computedLink = computed(() => {
  if (!props.isScreenViable)
    return '/'
  return keycloak.hasResourceRole('access-vnc')
    ? `/vnc/${props.machine.id}`
    : '/unauthorized'
})

const computedTarget = computed(() => {
  if (!props.isScreenViable || !keycloak.hasResourceRole('access-vnc')) {
    return '_self'
  }
  return '_blank'
})

function handleRouting(batchStatus: number, id: number) {
  if (batchStatus !== 0) {
    router.push(`/details/${id}`)
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
    <NuxtLink
      :to="computedLink"
      :target="computedTarget"
    >
      <span
        class="flex w-min whitespace-nowrap text-left"
        :class="
          isScreenViable
            ? 'cursor-pointer hover:(underline text-white)'
            : 'cursor-not-allowed opacity-70'
        "
      >
        {{ machine.name }}
      </span>
    </NuxtLink>
  </div>
  <div class="card-items justify-center">
    <span class="card-items__item">{{ machine.runningStartHour }}</span>
    <div
      class="card-items__item hover:underline hover:text-shadow-lg"
      :class="machine.runningBatchStatus !== 0 ? 'cursor-pointer' : 'cursor-not-allowed'"
      @click="handleRouting(machine.runningBatchStatus, machine.id)"
    >
      <span>
        {{ machine.runningJobOrder }}
      </span>
    </div>
  </div>
</template>
