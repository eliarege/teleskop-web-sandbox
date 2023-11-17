<script setup lang="ts">
import type { PropType } from 'vue'
import type { MachineData } from '~/shared/types'

defineProps({
  formatted: String,
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})
</script>

<template>
  <ElBacktop />
  <TeleskopNavbar :formatted="formatted" :machine-data="machineData" />
  <div class="w-full h-full px-2">
    <TeleskopCards :machine-data="machineData" />
  </div>
</template>
