<script setup lang="ts">
import { withBase } from 'ufo'
import { StepStatus } from '~/shared/constants'
import type { MergedBatchCommand } from '~/types/archive'

const props = defineProps<{
  commands: MergedBatchCommand[]
  selectedTime: Date
}>()

const emit = defineEmits<{
  (e: 'commandClicked', startTime: string): void
}>()

const config = useRuntimeConfig()

function isSelected(command: MergedBatchCommand) {
  return new Date(command.startTime) <= props.selectedTime
    && new Date(command.endTime) > props.selectedTime
}

function formattedStep(command: MergedBatchCommand) {
  return command.theoreticalStepNo % 1 > 0
    ? `${Math.ceil(command.theoreticalStepNo)}-${Math.ceil(command.theoreticalStepNo + 1)}`
    : command.theoreticalStepNo + 1
}

function handleCommandClick(command: MergedBatchCommand) {
  emit('commandClicked', command.startTime)
}

watch(() => props.selectedTime, async () => {
  await nextTick()
  document.querySelector('.command-btn--active')?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
})
</script>

<template>
  <div class="h-full px-2 py-1.5 overflow-x-auto flex flex-nowrap gap-1.5 items-center bg-white border-t border-gray-2">
    <button
      v-for="(command, index) in props.commands"
      :key="index"
      class="command-btn"
      :class="[
        isSelected(command) ? 'command-btn--active' : '',
        (!command.isFinished || command.stepStatus === StepStatus.SKIPPED_OR_PENDING) ? 'command-btn--disabled' : '',
      ]"
      :disabled="!command.isFinished || command.stepStatus === StepStatus.SKIPPED_OR_PENDING"
      @click="handleCommandClick(command)"
    >
      <span class="command-step">{{ formattedStep(command) }}</span>
      <q-img
        :src="withBase(`/command-icons/${command.icon}`, config.app.baseURL)"
        class="command-icon"
        loading="lazy"
      />
      <span class="command-name">{{ `(${command.commandNo}) ${command.commandName}` }}</span>
      <q-tooltip>{{ formattedStep(command) }} — ({{ command.commandNo }}) {{ command.commandName }}</q-tooltip>
    </button>
  </div>
</template>

<style scoped lang="postcss">
.command-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  height: 80px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid theme('colors.gray.300');
  background: white;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.command-btn:hover:not(.command-btn--disabled) {
  background: theme('colors.blue.50');
  border-color: theme('colors.blue.200');
}
.command-btn--active {
  background: rgba(0, 162, 255, 0.12) !important;
  border-color: rgba(0, 162, 255, 0.6) !important;
}
.command-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.command-step {
  font-size: 11px;
  color: theme('colors.gray.600');
  line-height: 1;
  flex-shrink: 0;
}
.command-icon {
  width: 48px;
  height: 36px;
  flex-shrink: 0;
}
.command-name {
  font-size: 10px;
  color: theme('colors.gray.700');
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  flex-shrink: 0;
  padding: 2px;
}
</style>
