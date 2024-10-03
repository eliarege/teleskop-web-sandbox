<script setup lang="ts">
import DMP from 'diff-match-patch'
import { LoadingSpinner } from '@teleskop/ui'
import { isValid } from 'date-fns'
import { indexOf } from 'lodash-es'
import type { CommandParameterDiff, ProgramStepCommandDiff, ProgramInfoHeader, ProgramVersion } from '~/utils/types'
import Main from '~/components/Comparison/Main.vue'
import type { Program, ProgramStep } from '~/shared/types'
import { useEditorStore } from '~/composables/editor'

const dmp = new DMP()
const route = useRoute()
const { m, p1, p2, v1, v2 } = route.query

enum DiffType {
  onlyLeft = -1,
  bothSides = 0,
  onlyRight = 1,
}

const paths = [
  `/api/machine/${m}/program/${p1}`,
 ` /api/machine/${m}/program/${p2}`,
]

let isValid1 = false
let isValid2 = false

if (v1 && v2) {
  paths[0] += `/version/${v1}`
  paths[1] += `/version/${v2}`

  const versions = await $fetch<ProgramVersion[]>(`/api/machine/${m}/program/${p1}/version`)
  const maxVersion = versions.length - 1
  if (versions[maxVersion].version === Number(v1)) {
    isValid1 = true
  } else if (versions[maxVersion].version === Number(v2)) {
    isValid2 = true
  }
} else {
  isValid1 = true
  isValid2 = true
}

const editor = useEditorStore()

const loading = ref(true)
onMounted(async () => {
  await editor.fetchMachine(Number(m))
  loading.value = false
})

const programOneData: Program = await $fetch(paths[0])
const programTwoData: Program = await $fetch(paths[1])

const programOneCommands = [] as number[]
const programTwoCommands = [] as number[]

programOneData.steps.forEach((step) => {
  programOneCommands.push(step.mainCommand.commandNo!)
})

programTwoData.steps.forEach((step) => {
  programTwoCommands.push(step.mainCommand.commandNo!)
})

// turning normal to utf8
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const a = new Uint8Array(programOneCommands)
const b = new Uint8Array(programTwoCommands)

// using diff func
const diffResult = dmp.diff_main(
  decoder.decode(a),
  decoder.decode(b),
)
// turning utf8 to normal
const mainResult = diffResult.map((value) => {
  return [value[0], [...encoder.encode(value[1])]]
})

const allResults: Array<[ProgramStepCommandDiff | null, ProgramStepCommandDiff | null]> = []

function compareCommands(left: ProgramStepCommandDiff, right: ProgramStepCommandDiff): void {
  // Compare main commands
  if (left.mainCommand.commandNo !== right.mainCommand.commandNo) {
    left.mainCommand.diff = true
    right.mainCommand.diff = true
  } else {
    // Compare parameters
    const leftParams = [...left.mainCommand.parameters]
    const rightParams = [...right.mainCommand.parameters]

    while (leftParams.length > 0 || rightParams.length > 0) {
      const leftParam = leftParams[0]
      const rightParam = rightParams[0]

      if (!rightParam) {
        const index = left.mainCommand.parameters.indexOf(leftParams.shift()!)
        left.mainCommand.parameters[index].diff = true
      } else if (!leftParam) {
        const index = right.mainCommand.parameters.indexOf(rightParams.shift()!)
        right.mainCommand.parameters[index].diff = true
      } else if (leftParam?.value === rightParam?.value && leftParam?.index === rightParam?.index) {
        leftParams.shift()
        rightParams.shift()
      } else {
        const indexLeft = left.mainCommand.parameters.indexOf(leftParams.shift()!)
        left.mainCommand.parameters[indexLeft].diff = true
        const indexRight = right.mainCommand.parameters.indexOf(rightParams.shift()!)
        right.mainCommand.parameters[indexRight].diff = true
      }
    }
  }

  // Compare parallel commands
  const leftParallel = [...left.parallelCommands]
  const rightParallel = [...right.parallelCommands]

  while (leftParallel.length > 0 || rightParallel.length > 0) {
    const leftCmd = leftParallel[0]
    const rightCmd = rightParallel[0]

    if (!leftCmd) {
      rightParallel.shift()!.diff = true
    } else if (!rightCmd) {
      leftParallel.shift()!.diff = true
    } else if (leftCmd.commandNo === rightCmd.commandNo) {
      // Compare parameters of matching parallel commands
      const leftParams = [...leftCmd.parameters]
      const rightParams = [...rightCmd.parameters]

      while (leftParams.length > 0 || rightParams.length > 0) {
        const leftParam = leftParams[0]
        const rightParam = rightParams[0]

        if (!rightParam) {
          const index = leftCmd.parameters.indexOf(leftParams.shift()!)
          leftCmd.parameters[index].diff = true
        } else if (!leftParam) {
          const index = rightCmd.parameters.indexOf(rightParams.shift()!)
          rightCmd.parameters[index].diff = true
        } else if (leftParam.value === rightParam.value && leftParam.index === rightParam.index) {
          leftParams.shift()
          rightParams.shift()
        } else {
          const indexLeft = leftCmd.parameters.indexOf(leftParams.shift()!)
          leftCmd.parameters[indexLeft].diff = true
          const indexRight = rightCmd.parameters.indexOf(rightParams.shift()!)
          rightCmd.parameters[indexRight].diff = true
        }
      }

      leftParallel.shift()
      rightParallel.shift()
    } else {
      leftParallel.shift()!.diff = true
      rightParallel.shift()!.diff = true
    }
  }
}

function createProgramStepCommandDiff(step: ProgramStep): ProgramStepCommandDiff {
  return {
    mainCommand: {
      diff: false,
      commandNo: step.mainCommand.commandNo || 0,
      parameters: (step.mainCommand.parameters || []).map(param => ({
        index: param.index,
        value: param.value,
        diff: false,
      })),
    },
    parallelCommands: step.parallelCommands.map(cmd => ({
      commandNo: cmd.commandNo!,
      diff: false,
      parameters: (cmd.parameters || []).map(param => ({
        index: param.index,
        value: param.value,
        diff: false,
      })),
    })),
  }
}

function processMainResult(): void {
  let leftIndex = 0
  let rightIndex = 0

  for (const [diffType, diffValue] of mainResult) {
    if (diffType === DiffType.bothSides) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const left = createProgramStepCommandDiff(programOneData!.steps[leftIndex])
        const right = createProgramStepCommandDiff(programTwoData!.steps[rightIndex])

        compareCommands(left, right)
        allResults.push([left, right])
        leftIndex++
        rightIndex++
      }
    } else if (diffType === DiffType.onlyLeft) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const left = createProgramStepCommandDiff(programOneData!.steps[leftIndex])
        left.mainCommand.diff = true
        allResults.push([left, null])
        leftIndex++
      }
    } else if (diffType === DiffType.onlyRight) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const right = createProgramStepCommandDiff(programTwoData!.steps[rightIndex])
        right.mainCommand.diff = true
        allResults.push([null, right])
        rightIndex++
      }
    }
  }
}

processMainResult()

const programOneHeader: ProgramInfoHeader = {
  programName: programOneData.name,
  programNo: programOneData.programNo,
  programVersion: Number(v1),
  stepCount: programOneData.steps.length,
  isValid: isValid1,
}

const programTwoHeader: ProgramInfoHeader = {
  programName: programTwoData.name,
  programNo: programTwoData.programNo,
  programVersion: Number(v2),
  stepCount: programTwoData.steps.length,
  isValid: isValid2,
}

console.log('All Results:', allResults)
</script>

<template>
  <div v-if="loading" class="spinner-container">
    <LoadingSpinner :has-background="false" />
  </div>
  <div v-else>
    <Main
      :all-results="allResults"
      :program-one-header="programOneHeader"
      :program-two-header="programTwoHeader"
    />
  </div>
</template>

<style lang="postcss">

</style>
