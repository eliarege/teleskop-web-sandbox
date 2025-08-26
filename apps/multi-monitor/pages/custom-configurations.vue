<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
</script>

<template>
  <div class="flex-center w-full h-full gap-3">
    <div class="w-full h-full px-2 py-1">
      <span>Machine Sort</span>
      <MachineConfigSort :machines="store.machines" />
    </div>
    <q-space />
    <div class="w-full h-full">
      <span>Machine Erp Parameters</span>
      <MachineConfigErpParameters />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
