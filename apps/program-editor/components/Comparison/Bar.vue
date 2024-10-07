<script setup lang="ts">
import { computed } from 'vue'
import type { CommandParameterDiff, ProgramStepCommandDiff } from '~/shared/types'

const props = defineProps<{
  diffResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
}>()

const areMainCommandsDifferent = computed(() => props.diffResults.map(([left, right]) =>
  !left || !right || left.mainCommand.commandNo !== right.mainCommand.commandNo,
))

const totalSteps = computed(() => props.diffResults.length)

function hasAnyDifference(index: number): boolean {
  const [left, right] = props.diffResults[index]

  if (!left || !right) {
    return true
  }

  if (left.mainCommand.parameters.some((param: CommandParameterDiff, i: number) => param.diff || right.mainCommand.parameters[i]?.diff)) {
    return true
  }
  if (left.parallelCommands.length !== right.parallelCommands.length) {
    return true
  }

  for (let i = 0; i < left.parallelCommands.length; i++) {
    const leftParallel = left.parallelCommands[i]
    const rightParallel = right.parallelCommands[i]

    if (leftParallel.diff || rightParallel.diff) {
      return true
    }

    if (leftParallel.parameters.some((param: CommandParameterDiff, j: number) => param.diff || rightParallel.parameters[j]?.diff)) {
      return true
    }
  }

  return false
}

function scrollToCommand(index: number) {
  document.getElementById(`command-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="fixed-bar">
    <div
      v-for="(_, index) in totalSteps"
      :key="index"
      class="bar-section"
      :style="{
        height: `${100 / totalSteps}%`,
        backgroundColor: areMainCommandsDifferent[index] ? 'red' : (hasAnyDifference(index) ? 'lightpink' : 'white'),
      }"
      @click="scrollToCommand(index)"
    >
      <q-space />
      <div class="custom-splitter" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.fixed-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #eee;
  border-right: 2px solid #ccc;
}

.bar-section {
  flex: 1;
  cursor: pointer;
  background-color: white;
}

.custom-splitter {
  @apply w-full h-1px border-1 border-black;
}
</style>
