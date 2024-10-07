<script setup lang="ts">
import Bar from './Bar.vue'
import Header from './Header.vue'
import Card from './Card.vue'
import type { ProgramInfoHeader, ProgramStepCommandDiff } from '~/shared/types'

const props = defineProps<{
  diffResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
  programOneHeader: ProgramInfoHeader
  programTwoHeader: ProgramInfoHeader
}>()
</script>

<template>
  <div class="w-full">
    <Bar
      :diff-results="diffResults"
    />
    <div class="flex-center w-full">
      <div class="comparison-table w-full h-full gap-2 q-pa-md space-y-4">
        <Header
          :program-one-header="programOneHeader"
          :program-two-header="programTwoHeader"
        />
        <div
          v-for="(result, index) in props.diffResults"
          :key="index"
          class="flex w-full justify-center flex-nowrap gap-2"
        >
          <Card
            :result-side="result[0]"
            class="w-full"
            :step-index="index"
          />

          <Card
            :result-side="result[1]"
            class="w-full"
            :step-index="index"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.comparison-table {
  margin-left: 20px;
}
</style>
