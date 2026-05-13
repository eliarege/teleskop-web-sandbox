<script setup lang="ts">
import type { TheoreticalProgram } from '~/types/archive'

const props = defineProps<{
  programs: TheoreticalProgram[]
  selectedTime: Date
}>()

const emit = defineEmits<{
  programClicked: [time: string]
}>()

function isSelectedTimeInProgram(prg: TheoreticalProgram): boolean {
  return props.selectedTime >= prg.startTime
    && props.selectedTime < prg.endTime
}
</script>

<template>
  <q-list
    class="wh-full bg-white overflow-y-auto py-2"
    dense
    separator
  >
    <q-item
      v-for="prg in props.programs"
      :key="prg.programNo"
      clickable
      :class="isSelectedTimeInProgram(prg)
        ? 'bg-blue-2'
        : ''"
      @click="emit('programClicked', prg.startTime.toISOString())"
    >
      <q-item-section>
        <span class="text-sm">
          {{ `${prg.programNo} - ${prg.programName}` }}
        </span>
      </q-item-section>
    </q-item>
  </q-list>
</template>
