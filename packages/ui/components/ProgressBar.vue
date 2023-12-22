<script setup lang="ts">
import type { PropType } from 'vue'
import type { MachineCardData } from '../types/MachineCard'

defineProps({
  data: {
    type: Object as PropType<MachineCardData>,
    required: true,
  },
  completitionRatio: Number,
})

// Color
function colorMethod(elapsedTime: number, theoreticalTime: number) {
  return elapsedTime > theoreticalTime ? '#FFDC00' : '#20D618'
}
</script>

<template>
  <div class="wrapper">
    <!-- backgorund -->
    <div class="background" />
    <!-- progress text -->
    <div class="pg-text">
      {{ completitionRatio! > 100 ? 100 : completitionRatio?.toFixed() }}
    </div>
    <!-- progress bar -->
    <div class="pg-bar">
      <div
        class="pg-bar-child"
        :style="{
          width: `${completitionRatio}%`,
          background: colorMethod(data.elapsedTime!, data.theoreticalDuration!),
        }"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  @apply flex flex-row w-full h-full rounded-2xl z-0 text-xs justify-start items-center;
  .background {
    @apply rounded-2xl bg-gray-500 w-100px h-4 absolute;
  }
  .pg-text {
    @apply flex absolute text-black z-2 h-4 w-full h-full justify-center items-center;
  }
  .pg-bar {
    @apply flex w-full items-center justify-start h-4;
    .pg-bar-child {
      transition: width 0.5s linear;
      @apply flex rounded-2xl h-4 max-w-100px absolute overflow-hidden;
      .pg-delay {
        @apply flex w-full items-center z-4 h-4 absolute justify-end self-end;
        .pg-delay-child {
          border-radius: 0 1em 1em 0;
          background: #d43b1c;
          @apply h-4 max-w-100px min-w-10px;
        }
      }
    }
  }
}
</style>
