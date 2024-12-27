<script setup lang="ts">
import { withBase } from 'ufo'
import type { MergedBatchCommand } from '~/types/archive'

const props = defineProps<{
  commands: MergedBatchCommand[]
  selectedTime: Date
}>()
const emit = defineEmits<{
  (e: 'commandClicked', startTime: string): void
}>()
function handleCommandClick(command: MergedBatchCommand) {
  emit('commandClicked', command.startTime)
}
const config = useRuntimeConfig()
</script>

<template>
  <div class="wh-full gap-2 overflow-x-scroll flex flex-nowrap">
    <q-btn
      v-for="(command, index) in props.commands"
      :key="index"
      class="min-w-30 p-1 overflow-hidden"
      outline
      :disable="!command.isFinished || !!command.stepStatus"
      :class="new Date(command.startTime) <= selectedTime && new Date(command.endTime) > selectedTime ? 'selected-command' : ''"
      no-caps
      @click="handleCommandClick(command)"
    >
      <div class="w-full text-left pl-1 whitespace-nowrap overflow-x-hidden text-xs">
        {{ command.theoreticalStepNo % 1 > 0 ? `${Math.ceil(command.theoreticalStepNo)}-${Math.ceil(command.theoreticalStepNo + 1)}` : command.theoreticalStepNo + 1 }} -
        {{ `(${command.commandNo}) ${command.commandName}` }}
        <q-tooltip>
          {{ command.theoreticalStepNo % 1 > 0 ? `${command.theoreticalStepNo}-${command.theoreticalStepNo + 1}` : command.theoreticalStepNo + 1 }} -
          {{ `(${command.commandNo}) ${command.commandName}` }}
        </q-tooltip>
      </div>
      <div>
        <img
          :src="withBase(`/command-icons/${command.icon}`, config.app.baseURL)"
          class="w-25 h-12"
        >
      </div>
    </q-btn>
  </div>
</template>

<style scoped lang="postcss">
.q-btn.disabled {
  opacity: 0.35 !important;
}
.q-btn--outline::before {
  border-color: theme('colors.gray.400');
}
.selected-command {
  background: rgba(0, 162, 255, 0.37) !important;
}
</style>
