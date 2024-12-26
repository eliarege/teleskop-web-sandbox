<script setup lang="ts">
import type { BasicProgram } from '~/types/archive'

const props = defineProps<{
  programs: BasicProgram[]
  selectedTime: Date
}>()
</script>

<template>
  <div class="flex w-full gap-2 pt-3">
    <div
      v-for="prg of programs"
      :key="prg.programNo"
      class="text-xs item-class w-full px-2 py-0.5"
      :class="new Date(selectedTime) > new Date(prg.startTime) && new Date(selectedTime) < new Date(prg.endTime) ? 'text-bold' : ''"
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
