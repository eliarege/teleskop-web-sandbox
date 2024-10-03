<script setup lang="ts">
import Bar from './Bar.vue'
import Header from './Header.vue'
import Card from './Card.vue'
import type { ProgramStepCommandDiff, ProgramInfoHeader } from '~/utils/types'

const props = defineProps<{
  allResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
  programOneHeader: ProgramInfoHeader
  programTwoHeader: ProgramInfoHeader
}>()
</script>

<template>
  <div class="w-full">
    <Bar
      :all-results="allResults"
    />
    <div class="flex-center w-full">
      <div class="comparison-table w-full h-full gap-2 q-pa-md space-y-4">
        <Header
          :program-one-header="programOneHeader"
          :program-two-header="programTwoHeader"
        />
        <div
          v-for="(result, index) in props.allResults"
          :key="index"
          class="flex w-full justify-center flex-nowrap gap-2"
        >
          <Card
            :result-side="result[0]"
            class="w-full"
            :index="index"
          />

          <Card
            :result-side="result[1]"
            class="w-full"
            :index="index"
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
