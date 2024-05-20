<script lang="ts" setup>
const props = defineProps<{
  program: {
    machineId: number
    machineName: string
    programNo: number
    name: string
  }
}>()
</script>

<template>
  <div v-if="props.program && props.program.name && props.program.name.length > 0" class="space-x-3 text-sm">
    <span>{{ props.program.machineId }}</span>
    <span>-</span>
    <span>{{ props.program.machineName }}</span>
    <span>|</span>
    <span>{{ props.program.programNo }}</span>
    <span>-</span>
    <span>{{ props.program.name }}</span>
  </div>
  <div v-else>
    Program bilgileri yüklenemedi.
  </div>
</template>
