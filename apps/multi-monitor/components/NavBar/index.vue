<script setup lang="ts">
import type { MachineData } from '~/shared/types'

interface NavBarProps {
  machineData: MachineData[]
  formatted: string
}
defineProps<NavBarProps>()
</script>

<template>
  <div class="navbar-wrapper">
    <NavBarPieCharts :machine-data />
    <NavBarConsumption />
    <span class="flex items-center justify-end font-extrabold mr-4 text-gray-600">
      {{ formatted }}
    </span>
  </div>
</template>

<style scoped lang="postcss">
.navbar-wrapper {
  grid-template-columns: 0.4fr 1fr 0.3fr;
  @apply grid w-full gap-5;
}
</style>
