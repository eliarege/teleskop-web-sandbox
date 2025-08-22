<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
</script>

<template>
  <div>
    <MachineConfigSort :machines="store.machines" />
  </div>
</template>

<style scoped lang="postcss">
</style>
