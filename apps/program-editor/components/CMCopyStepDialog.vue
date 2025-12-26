<script setup lang="ts">
import type { Machine, ProgramStep } from '~/shared/types'

const props = defineProps<{
  machine: Machine
  program: {
    programNo: number
    name: string
  }
  selectedSteps: ProgramStep[]
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const nodes = computed(() =>
  props.selectedSteps.map(step => ({
    id: `${step.stepId}-${step.mainCommand.commandId}`,
    label: getCommandName(step.mainCommand.commandNo),
    selectable: true,
    children: step.parallelCommands.map(parallelCmd => ({
      id: `${step.stepId}-${parallelCmd.commandId}`,
      label: getCommandName(parallelCmd.commandNo),
      selectable: true,
    })),
  })),
)

const ticked = ref<string[]>(
  props.selectedSteps.flatMap(step => [
    `${step.stepId}-${step.mainCommand.commandId}`,
    ...step.parallelCommands.map(cmd => `${step.stepId}-${cmd.commandId}`),
  ]),
)

function getCommandName(commandNo: number): string {
  return props.machine.commands.get(commandNo)?.name || t('unknownCommand')
}

function handleDialogOK() {
  const result: ProgramStep[] = []

  props.selectedSteps.forEach((step) => {
    const isMainCmdTicked = ticked.value.includes(`${step.stepId}-${step.mainCommand.commandId}`)
    const tickedParallelCmds = step.parallelCommands.filter(cmd =>
      ticked.value.includes(`${step.stepId}-${cmd.commandId}`),
    )
    if (isMainCmdTicked || tickedParallelCmds.length) {
      result.push({
        ...step,
        parallelCommands: tickedParallelCmds,
      })
    }
  })

  onDialogOK(result)
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="w-120 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('copyStepDialog.title') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ machine.id }} - {{ machine.name }}
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ program.programNo }} - {{ program.name }}
        </div>
      </q-card-section>

      <q-card-section class="pt-0 items-center">
        <span class="q-ml-sm"> {{ t('copyStepDialog.message') }}</span>
      </q-card-section>

      <q-card-section class="pt-0">
        <q-tree
          v-model:ticked="ticked"
          :nodes="nodes"
          node-key="id"
          tick-strategy="leaf"
          default-expand-all
          dense
          class="w-full h-100 overflow-y-scroll"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          class="bg-primary text-white"
          :label="t('ok')"
          flat
          @click="handleDialogOK()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
