<script setup lang="ts">
import type { MachineCommand, ProgramStep } from '~/types/archive'

const props = defineProps<{
  machineCommands: MachineCommand[]
  theoreticalProgramStep: ProgramStep
  actualProgramStep: ProgramStep
  stepIndex: number
}>()

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const theoreticalStep = computed(() => props.theoreticalProgramStep)
const actualStep = computed(() => props.actualProgramStep)
const stepNo = computed(() => props.stepIndex + 1)

function getMachineCommand(commandNo: number): MachineCommand | null {
  return props.machineCommands.find(cmd => cmd.commandNo === commandNo) || null
}

function getCommandName(commandNo: number): string {
  const command = getMachineCommand(commandNo)
  return command ? command.name : 'Unknown Command'
}

function getParameterName(commandNo: number, parameterIndex: number): string {
  const command = getMachineCommand(commandNo)
  if (command) {
    const parameter = command.parameters.find(param => param.index === parameterIndex)
    return parameter ? parameter.name : 'Unknown Parameter'
  }
  return 'Unknown Parameter'
}

function getParameterValueName(commandNo: number, parameterIndex: number): string {
  const command = getMachineCommand(commandNo)
  if (command) {
    const parameter = command.parameters.find(param => param.index === parameterIndex)
    if (parameter && parameter.type === 'SELECT') {
      const selection = parameter.selections?.find(sel => sel.value === Number(parameter.value))
      return selection ? selection.name : `Unknown Value (${parameter.value})`
    } else if (parameter) {
      if (parameter.type === 'NUMBER' && parameter.format === 'DURATION') {
        return formatDuration(Number(parameter.value))
      }
      return String(parameter.value)
    }
  }
  return 'Unknown Value'
}

function getIOName(commandNo: number, ioIndex: number): string {
  const command = getMachineCommand(commandNo)
  if (command) {
    const ioItem = command.ioList.find(io => io.index === ioIndex)
    return ioItem ? ioItem.name : 'Unknown IO'
  }
  return 'Unknown IO'
}

function getIOSelectionNames(commandNo: number, ioIndex: number, selections: [number, number][]): string {
  if (!selections || selections.length === 0)
    return '-'

  const command = getMachineCommand(commandNo)
  if (!command)
    return 'Unknown IO Value'

  const ioDefinition = command.ioList.find(io => io.index === ioIndex)
  if (!ioDefinition)
    return 'Unknown IO Value'

  return selections
    .map(([type, physicalId]) => {
      const selection = ioDefinition.selections.find(s => s.type === type && s.physicalId === physicalId)
      return selection ? selection.name : `Unknown (${physicalId})`
    })
    .join(', ')
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-200 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('stepDetailsDialog.title') }}
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
      </q-card-section>

      <!-- Table Section -->
      <q-card-section class="max-h-150 w-full pt-0">
        <!-- Description -->
        <div class="q-mb-md">
          {{ t('stepDetailsDialog.description', { stepNo }) }}
        </div>
        <!-- Two Columns -->
        <div class="row q-col-gutter-md">
          <!-- Gerçekleşen -->
          <div class="col-12 col-md-6">
            <q-card
              flat
              bordered
              class="q-pa-md"
            >
              <div class="text-sm font-bold text-gray-8 dark:text-gray-3 q-mb-sm">
                {{ t('stepDetailsDialog.actualStep', { stepNo }) }}
              </div>

              <q-separator class="q-my-sm" />

              <!-- Main Command -->
              <div class="q-mb-xs">
                <div class="text-sm font-bold text-gray-9 dark:text-gray-2 leading-snug">
                  {{ actualStep.mainCommand.commandNo }}. {{ getCommandName(actualStep.mainCommand.commandNo) }}
                </div>

                <!-- Parameters -->
                <div class="pl-3 q-mt-xs">
                  <div
                    v-for="parameter in actualStep.mainCommand.parameters"
                    :key="parameter.index"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getParameterName(actualStep.mainCommand.commandNo, parameter.index) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getParameterValueName(actualStep.mainCommand.commandNo, parameter.index) }}</span>
                  </div>

                  <!-- IOList -->
                  <div
                    v-for="ioItem in actualStep.mainCommand.ioList"
                    :key="ioItem.ioIndex"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getIOName(actualStep.mainCommand.commandNo, ioItem.ioIndex) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getIOSelectionNames(actualStep.mainCommand.commandNo, ioItem.ioIndex, ioItem.value) }}</span>
                  </div>
                </div>
              </div>

              <!-- Parallel Commands -->
              <div
                v-for="(command, index) in actualStep.parallelCommands || []"
                :key="index"
                class="q-mt-sm q-mb-xs"
              >
                <div class="text-sm font-bold text-gray-9 dark:text-gray-2 leading-snug">
                  {{ command.commandNo }}. {{ getCommandName(command.commandNo) }}
                </div>

                <!-- Parameters -->
                <div class="pl-3 q-mt-xs">
                  <div
                    v-for="parameter in command.parameters"
                    :key="parameter.index"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getParameterName(command.commandNo, parameter.index) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getParameterValueName(command.commandNo, parameter.index) }}</span>
                  </div>

                  <!-- IOList -->
                  <div
                    v-for="ioItem in command.ioList"
                    :key="ioItem.ioIndex"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getIOName(command.commandNo, ioItem.ioIndex) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getIOSelectionNames(command.commandNo, ioItem.ioIndex, ioItem.value) }}</span>
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Teorik -->
          <div class="col-12 col-md-6">
            <q-card
              flat
              bordered
              class="q-pa-md"
            >
              <div class="text-sm font-bold text-gray-8 dark:text-gray-3 q-mb-sm">
                {{ t('stepDetailsDialog.theoreticalStep', { stepNo }) }}
              </div>

              <q-separator class="q-my-sm" />

              <!-- Main Command -->
              <div class="q-mb-xs">
                <div class="text-sm font-bold text-gray-9 dark:text-gray-2 leading-snug">
                  {{ theoreticalStep.mainCommand.commandNo }}. {{ getCommandName(theoreticalStep.mainCommand.commandNo) }}
                </div>

                <!-- Parameters -->
                <div class="pl-3 q-mt-xs">
                  <div
                    v-for="parameter in theoreticalStep.mainCommand.parameters"
                    :key="parameter.index"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getParameterName(theoreticalStep.mainCommand.commandNo, parameter.index) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getParameterValueName(theoreticalStep.mainCommand.commandNo, parameter.index) }}</span>
                  </div>

                  <!-- IOList -->
                  <div
                    v-for="ioItem in theoreticalStep.mainCommand.ioList"
                    :key="ioItem.ioIndex"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getIOName(theoreticalStep.mainCommand.commandNo, ioItem.ioIndex) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getIOSelectionNames(theoreticalStep.mainCommand.commandNo, ioItem.ioIndex, ioItem.value) }}</span>
                  </div>
                </div>
              </div>

              <!-- Parallel Commands -->
              <div
                v-for="(command, index) in theoreticalStep.parallelCommands || []"
                :key="index"
                class="q-mt-sm q-mb-xs"
              >
                <div class="text-sm font-bold text-gray-9 dark:text-gray-2 leading-snug">
                  {{ command.commandNo }}. {{ getCommandName(command.commandNo) }}
                </div>

                <!-- Parameters -->
                <div class="pl-3 q-mt-xs">
                  <div
                    v-for="parameter in command.parameters"
                    :key="parameter.index"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getParameterName(command.commandNo, parameter.index) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getParameterValueName(command.commandNo, parameter.index) }}</span>
                  </div>

                  <!-- IOList -->
                  <div
                    v-for="ioItem in command.ioList"
                    :key="ioItem.ioIndex"
                    class="text-xs flex gap-1 leading-relaxed"
                  >
                    <span class="font-semibold text-gray-7 dark:text-gray-4">{{ getIOName(command.commandNo, ioItem.ioIndex) }}:</span>
                    <span class="text-gray-6 dark:text-gray-5">{{ getIOSelectionNames(command.commandNo, ioItem.ioIndex, ioItem.value) }}</span>
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Dialog Actions -->
      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
