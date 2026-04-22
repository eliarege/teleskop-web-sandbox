<script setup lang="ts">
import Bar from './Bar.vue'
import Header from './Header.vue'
import Card from './Card.vue'
import type { ProgramInfoHeader, ProgramStepCommandDiff } from '~/shared/types'

defineProps<{
  diffResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
  programOneHeader: ProgramInfoHeader
  programTwoHeader: ProgramInfoHeader
}>()
</script>

<template>
  <div class="pr-4 pl-2 py-4 space-y-3 max-w-full">
    <Header
      :program-one-header="programOneHeader"
      :program-two-header="programTwoHeader"
      :diff-results="diffResults"
    />

    <div
      v-for="(result, index) in diffResults"
      :id="`step-${index}`"
      :key="index"
      class="grid grid-cols-2 gap-2 items-start"
    >
      <!-- Step number -->
      <div class="col-span-2 flex items-center gap-2 -mb-1">
        <span class="text-10px text-gray-4 dark:text-gray-7 select-none">{{ index + 1 }}</span>
        <div class="h-px flex-1 bg-gray-3/40 dark:bg-dark-1/60" />
      </div>

      <Card :result-side="result[0]" :step-index="index" />
      <Card :result-side="result[1]" :step-index="index" />
    </div>

    <Bar :diff-results="diffResults" />
  </div>
</template>
