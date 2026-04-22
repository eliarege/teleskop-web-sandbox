<script setup lang="ts">
import type { BasicProgram } from '~/types/archive'

const props = defineProps<{
  programs: BasicProgram[]
  selectedTime: Date
}>()

function isSelectedTimeInProgram(prg: BasicProgram): boolean {
  const sel = new Date(props.selectedTime).getTime()
  const start = new Date(prg.startTime).getTime()
  const end = new Date(prg.endTime).getTime()
  return sel > start && sel < end
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
      :class="isSelectedTimeInProgram(prg)
        ? 'bg-blue-2'
        : ''"
    >
      <q-item-section>
        <span class="text-sm">
          {{ `${prg.programNo} - ${prg.programName}` }}
        </span>
      </q-item-section>
    </q-item>
  </q-list>
</template>
