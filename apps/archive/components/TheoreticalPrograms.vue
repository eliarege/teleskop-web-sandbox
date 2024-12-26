<script setup lang="ts">
import type { BatchCommand } from '~/types/archive'

const props = defineProps<{
  programs: any[]
  selectedTime: Date
}>()
</script>

<template>
  <div class="flex w-full gap-2 pt-3">
    <div
      v-for="prg of programs"
      :key="prg.programNo"
      class="text-xs item-class w-full px-2 py-0.5"
      :class="selectedTime > prg.startTime && selectedTime < prg.endTime ? 'text-bold' : ''"
      dense
    >
      {{ `${prg.programNo} - ${prg.programName}` }}
    </div>
  </div>
</template>

<style scoped>
.item-class {
  border-width: 1px;
  border-color: grey;
  border-radius: 5px;
  font-size: small;
}
</style>
