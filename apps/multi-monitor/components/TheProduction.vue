<script setup lang="ts">
import type { PropType } from 'vue'
import { ElBacktop } from 'element-plus'
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

defineProps({
  formatted: String,
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})

const store = useDataStore()
</script>

<template>
  <ElBacktop />
  <TeleskopNavbar :formatted="formatted" :machine-data="machineData" />
  <div class="w-full h-full px-2">
    <TeleskopCards :machine-data="machineData" />
  </div>
</template>

<style lang="scss">
// .alarm {
//   animation: alarm 0.5s linear infinite;
// }
// @keyframes alarm {
//   0% {
//     @apply text-green-400;
//   }
//   25% {
//     @apply text-white;
//   }
//   75% {
//     @apply text-red-900;
//   }
//   100% {
//     @apply text-green-400;
//   }
// }
</style>
