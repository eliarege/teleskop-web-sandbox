<script setup lang="ts">
import type { MachineData } from '~/shared/types'

defineProps<{ machineData: MachineData[] }>()
const emit = defineEmits(['close'])
</script>

<template>
  <div class="bg-white rounded p-1 h-auto">
    <Icon
      name="material-symbols:close"
      size="20"
      @click="emit('close')"
    />
    <NavBarPieCharts :machine-data />
    <q-separator spaced />
    <NavBarConsumption />
  </div>
</template>

<style scoped lang="postcss">
</style>
