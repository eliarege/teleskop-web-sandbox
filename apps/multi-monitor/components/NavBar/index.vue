<script setup lang="ts">
import type { MachineData } from '~/shared/types'

interface NavBarProps {
  machineData: MachineData[]
  formatted: string
}
defineProps<NavBarProps>()
</script>

<template>
  <div class="grid grid-cols-[0.4fr_1fr_0.3fr] w-full gap-5">
    <NavBarPieCharts :machine-data />
    <NavBarConsumption />
    <span class="flex items-center justify-end font-extrabold mr-4 text-gray-600 md:(text-center)">
      {{ formatted }}
    </span>
  </div>
</template>

<style scoped lang="postcss">
</style>
