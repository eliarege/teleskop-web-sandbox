<script setup lang="ts">
// süreye formatlama :
// parametrelerin 1 2 (selection list)

// eski versiyonu editleyememe

import { useRouter } from 'vue-router'
import type { MachineCommand, ProgramStepCommand, ProgramStep} from '~/shared/types'
import { useEditorStore } from '~/composables/editor'

const props = defineProps<Props>()
const editor = useEditorStore()
const router = useRouter()
const { t } = useI18n()

interface Props {
  resultArray: [ProgramStep | null, ProgramStep | null][]
  parallelDifferences: Array<{
    onlyLeft: ProgramStepCommand[]
    onlyRight: ProgramStepCommand[]
    intersection: [ProgramStepCommand, ProgramStepCommand][]
  }>
  mainParametersDifferences: Array<{
    leftDifferentValues: any[]
    rightDifferentValues: any[]
    sameValues: any[]
  }>
  firstProgram: number
  firstVersion: number
  secondProgram: number
  secondVersion: number
  machine: number
}

function getCommandInfo(commandNo: number): MachineCommand {
  return editor.machine.commands.get(commandNo)!
}

function getProgramName(programNumber: number): string {
  return editor.allPrograms.find(p => p.programNo === programNumber)?.name || ''
}

function getParameterName(commandNo: number, paramIndex: number): string {
  const command = getCommandInfo(commandNo)
  return command.parameters[paramIndex]?.name || `Parameter ${paramIndex + 1}`
}

function isParameterDifferent(rowIndex: number, side: 0 | 1, param: any) {
  const diff = props.mainParametersDifferences[rowIndex]
  if (!diff)
    return true

  if (side === 0) {
    return diff.leftDifferentValues.some(p => p.index === param.index)
  } else {
    return diff.rightDifferentValues.some(p => p.index === param.index)
  }
}

function getParallelCommands(rowIndex: number, side: 0 | 1) {
  const diff = props.parallelDifferences[rowIndex]
  if (!diff)
    return []
  if (side === 0) {
    return [...diff.onlyLeft, ...diff.intersection.map(([left]) => left)]
  } else {
    return [...diff.onlyRight, ...diff.intersection.map(([, right]) => right)]
  }
}

function isParallelDifferent(rowIndex: number, commandNo: number) {
  const diff = props.parallelDifferences[rowIndex]
  if (!diff)
    return true
  return diff.onlyLeft.some(cmd => cmd.commandNo === commandNo)
    || diff.onlyRight.some(cmd => cmd.commandNo === commandNo)
}

function isParallelParameterDifferent(rowIndex: number, commandNo: number, param: any) {
  const diff = props.parallelDifferences[rowIndex]
  if (!diff)
    return false

  const leftCommand = diff.intersection.find(([left]) => left.commandNo === commandNo)?.[0]
  const rightCommand = diff.intersection.find(([, right]) => right.commandNo === commandNo)?.[1]

  if (!leftCommand || !rightCommand)
    return false

  // Parametreler arasında fark olup olmadığını kontrol et
  const leftParam = leftCommand.parameters.find(p => p.index === param.index)
  const rightParam = rightCommand.parameters.find(p => p.index === param.index)

  return leftParam?.value !== rightParam?.value
}

function getParameterValue(rowIndex: number, side: 0 | 1, param: any) {
  const diff = props.mainParametersDifferences[rowIndex]
  if (!diff)
    return param.value === -1 ? '' : param.value

  if (side === 0) {
    const leftDiffParam = diff.leftDifferentValues.find(p => p.index === param.index)
    return leftDiffParam ? (leftDiffParam.value === -1 ? '' : leftDiffParam.value) : (param.value === -1 ? '' : param.value)
  } else {
    const rightDiffParam = diff.rightDifferentValues.find(p => p.index === param.index)
    return rightDiffParam ? (rightDiffParam.value === -1 ? '' : rightDiffParam.value) : (param.value === -1 ? '' : param.value)
  }
}

function getAllParameters(rowIndex: number, side: 0 | 1) {
  const command = props.resultArray[rowIndex][side]
  if (!command)
    return []

  const diff = props.mainParametersDifferences[rowIndex]
  if (!diff)
    return command.mainCommand.parameters

  const sameParams = diff.sameValues
  const diffParams = side === 0 ? diff.leftDifferentValues : diff.rightDifferentValues

  return [...sameParams, ...diffParams].sort((a, b) => a.index - b.index)
}

const areMainCommandsDifferent = computed(() => {
  return props.resultArray.map(([left, right]) => {
    if (!left || !right)
      return true
    return left.mainCommand.commandNo !== right.mainCommand.commandNo
  })
})

const program1MainCommandCount = computed(() => props.resultArray.filter(row => row[0] !== null).length)
const program2MainCommandCount = computed(() => props.resultArray.filter(row => row[1] !== null).length)

function editProgram(machineNumber: number, programNumber: number) {
  router.push(`/machine/${machineNumber}/program/${programNumber}`)
}

function scrollToCommand(index: number) {
  const element = document.getElementById(`command-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const totalSteps = computed(() => props.resultArray.length)
</script>

<template>
  <div class="fixed-bar">
    <div
      v-for="(row, index) in resultArray"
      :key="index"
      class="bar-section"
      :class="[{ 'red-bar': areMainCommandsDifferent[index] }]"
      :style="{ height: `${100 / totalSteps}%` }"
      :data-index="index"
      @click="scrollToCommand(index)"
    >
      <q-space />
      <div class="custom-splitter" />
    </div>
  </div>
  <div class="comparison-table q-pa-md">
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Program 1 -->
      <div class="col-6">
        <q-card>
          <q-card-section class="flex justify-between items-center">
            <div>
              <div class="text-md">
                {{ t('program.name') }} : {{ getProgramName(props.firstProgram) }}
              </div>
              <div class="text-md">
                {{ t('program.programNo') }} : {{ firstProgram }}
              </div>
              <div v-if=" firstVersion && secondVersion" class="text-md">
                {{ t('contextMenu.version._') }} : {{ firstVersion }}
              </div>
              <div class="text-md">
                {{ t('program.stepCount') }} : {{ program1MainCommandCount }}
              </div>
            </div>
            <q-btn
              color="primary"
              label="DÜZENLE"
              @click="editProgram(props.machine, props.firstProgram)"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6">
        <q-card>
          <q-card-section class="flex justify-between items-center">
            <div>
              <div class="text-md">
                {{ t('program.name') }} : {{ getProgramName(props.secondProgram) }}
              </div>
              <div class="text-md">
                {{ t('program.programNo') }} : {{ secondProgram }}
              </div>
              <div v-if=" firstVersion && secondVersion" class="text-md">
                {{ t('contextMenu.version._') }} : {{ secondVersion }}
              </div>
              <div class="text-md">
                {{ t('program.stepCount') }} : {{ program2MainCommandCount }}
              </div>
            </div>
            <q-btn
              color="primary"
              label="DÜZENLE"
              @click="editProgram(props.machine, props.secondProgram)"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div
      v-for="(row, index) in resultArray"
      :id="`command-${index}`"
      :key="index"
      class="row q-col-gutter-md q-mb-md"
    >
      <div class="col-12">
        <q-card class="comparison-row">
          <q-card-section class="section-grid">
            <!-- Program 1 (Left Side) -->
            <div class="w-full" :class="{ 'all-red': areMainCommandsDifferent[index] }">
              <template v-if="row[0]">
                <div class="main-command">
                  <div class="text-h6">
                    {{ row[0].mainCommand.commandNo }} - {{ getCommandInfo(row[0].mainCommand.commandNo).name }}
                  </div>
                </div>

                <q-separator
                  v-if="getAllParameters(index, 0).length > 0"
                  class="separator-thick"
                />

                <div v-if="getAllParameters(index, 0).length > 0" class="parameters q-py-xs">
                  <q-chip
                    v-for="param in getAllParameters(index, 0)"
                    :key="param.index"
                    :color="isParameterDifferent(index, 0, param) ? 'red' : 'secondary'"
                    text-color="white"
                    class="q-ma-xs"
                  >
                    {{ getParameterName(row[0].mainCommand.commandNo, param.index) }}:
                    {{ getParameterValue(index, 0, param) }}
                  </q-chip>
                </div>

                <q-separator
                  v-if="getParallelCommands(index, 0).length > 0"
                  class="separator-thick"
                />

                <div
                  class="parallel-commands q-py-xs"
                  :class="{
                    'bg-light-gray': getParallelCommands(index, 0).length > 0,
                    'bg-white': getParallelCommands(index, 0).length === 0,
                  }"
                >
                  <q-chip
                    v-for="parallel in getParallelCommands(index, 0)"
                    :key="parallel.commandNo"
                    :color="isParallelDifferent(index, parallel.commandNo) ? 'red' : 'secondary'"
                    text-color="white"
                    class="q-ma-xs"
                  >
                    {{ parallel.commandNo }} - {{ getCommandInfo(parallel.commandNo).name }}
                    <q-badge
                      v-for="param in parallel.parameters"
                      :key="param.index"
                      color="white"
                      :text-color="isParallelDifferent(index, parallel.commandNo) ? 'red' : (isParallelParameterDifferent(index, parallel.commandNo, param) ? 'red' : 'green')"
                      class="q-ml-sm"
                    >
                      {{ getParameterName(parallel.commandNo, param.index) }}:
                      {{ param.value !== -1 ? param.value : '' }}
                    </q-badge>
                  </q-chip>
                </div>
              </template>
            </div>
            <div class="custom-splitter-horizontal" />
            <!-- Program 2 (Right Side) -->
            <div class="w-full" :class="{ 'all-red': areMainCommandsDifferent[index] }">
              <template v-if="row[1]">
                <div class="main-command">
                  <div class="text-h6">
                    {{ row[1].mainCommand.commandNo }} - {{ getCommandInfo(row[1].mainCommand.commandNo).name }}
                  </div>
                </div>

                <q-separator
                  v-if="getAllParameters(index, 1).length > 0"
                  class="separator-thick"
                />

                <div v-if="getAllParameters(index, 1).length > 0" class="parameters q-py-xs">
                  <q-chip
                    v-for="param in getAllParameters(index, 1)"
                    :key="param.index"
                    :color="isParameterDifferent(index, 1, param) ? 'red' : 'secondary'"
                    text-color="white"
                    class="q-ma-xs"
                  >
                    {{ getParameterName(row[1].mainCommand.commandNo, param.index) }}:
                    {{ getParameterValue(index, 1, param) }}
                  </q-chip>
                </div>

                <q-separator
                  v-if="getParallelCommands(index, 1).length > 0"
                  class="separator-thick"
                />

                <div
                  class="parallel-commands q-py-xs"
                  :class="{
                    'bg-light-gray': getParallelCommands(index, 1).length > 0,
                    'bg-white': getParallelCommands(index, 1).length === 0,
                  }"
                >
                  <q-chip
                    v-for="parallel in getParallelCommands(index, 1)"
                    :key="parallel.commandNo"
                    :color="isParallelDifferent(index, parallel.commandNo) ? 'red' : 'secondary'"
                    text-color="white"
                    class="q-ma-xs"
                  >
                    {{ parallel.commandNo }} - {{ getCommandInfo(parallel.commandNo).name }}
                    <q-badge
                      v-for="param in parallel.parameters"
                      :key="param.index"
                      color="white"
                      :text-color="isParallelDifferent(index, parallel.commandNo) ? 'red' : (isParallelParameterDifferent(index, parallel.commandNo, param) ? 'red' : 'green')"
                      class="q-ml-sm"
                    >
                      {{ getParameterName(parallel.commandNo, param.index) }}:
                      {{ param.value !== -1 ? param.value : '' }}
                    </q-badge>
                  </q-chip>
                </div>
              </template>
            </div>
          </q-card-section>
        </q-card>
      </div>
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
.custom-splitter {
  @apply w-full h-1px border-1 border-black;
}
.custom-splitter-horizontal {
  @apply w-1px h-full border-1 border-black;
}
.section-grid {
  display: grid;
  grid-template-columns: 1fr 7px 1fr;
  gap: 3px;
  justify-items: center;
}
.bar-section {
  flex: 1;
  cursor: pointer;
  background-color: white;
}

.red-bar {
  background-color: red;
}

.main-command .text-h6 {
  font-weight: bold;
}

.text-md {
  font-weight: bold;
}

.comparison-table {
  margin-left: 20px;
}

.all-red {
  color: red;
}

.all-red .q-chip {
  background-color: red !important;
  color: white !important;
}

.all-red .q-badge {
  background-color: white !important;
  color: red !important;
}

.parallel-commands {
  background-color: lightgray;
}

.separator-thick {
  height: 3px;
  background-color: #c0c0c0;
}

.q-card {
  border: 2px solid #675e5e;
}
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}
</style>
