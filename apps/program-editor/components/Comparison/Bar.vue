<script setup lang="ts">
import type { CommandParameterDiff, ProgramStepCommandDiff } from '~/shared/types'

const props = defineProps<{
  diffResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
}>()

function isCommandDiff(index: number): boolean {
  const [left, right] = props.diffResults[index]
  return !left || !right || left.mainCommand.commandNo !== right.mainCommand.commandNo
}

function hasParamDiff(index: number): boolean {
  const [left, right] = props.diffResults[index]
  if (!left || !right) return false
  if (left.mainCommand.parameters.some((p: CommandParameterDiff, i: number) => p.diff || right.mainCommand.parameters[i]?.diff))
    return true
  if (left.parallelCommands.length !== right.parallelCommands.length)
    return true
  for (let i = 0; i < left.parallelCommands.length; i++) {
    const lp = left.parallelCommands[i]
    const rp = right.parallelCommands[i]
    if (lp.diff || rp.diff) return true
    if (lp.parameters.some((p: CommandParameterDiff, j: number) => p.diff || rp.parameters[j]?.diff)) return true
  }
  return false
}

function getSegmentColor(index: number): string {
  if (isCommandDiff(index)) return 'var(--seg-red)'
  if (hasParamDiff(index)) return 'var(--seg-amber)'
  return 'transparent'
}

function scrollToStep(index: number) {
  document.getElementById(`step-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <div class="minimap">
    <div
      v-for="(_, index) in diffResults.length"
      :key="index"
      class="segment"
      :style="{ backgroundColor: getSegmentColor(index) }"
      :title="`Step ${index + 1}`"
      @click="scrollToStep(index)"
    />
  </div>
</template>

<style scoped lang="postcss">
.minimap {
  position: fixed;
  right: 0;
  top: 0;
  width: 10px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.05);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 100;

  --seg-red: rgba(239, 68, 68, 0.75);
  --seg-amber: rgba(245, 158, 11, 0.75);
}

:global(.body--dark) .minimap {
  background-color: rgba(255, 255, 255, 0.04);
  border-left-color: rgba(255, 255, 255, 0.06);
}

.segment {
  flex: 1;
  cursor: pointer;
  transition: opacity 0.15s;
  min-height: 2px;
}

.segment:hover {
  opacity: 0.6;
}
</style>
