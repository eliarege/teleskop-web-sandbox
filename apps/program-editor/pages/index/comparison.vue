<script setup lang="ts">
import DMP from 'diff-match-patch'
import Main from '~/components/Comparison/Main.vue'
import type { ContextBarButtons, Program, ProgramHeaderArchive, ProgramInfoHeader, ProgramStep, ProgramStepCommandDiff } from '~/shared/types'
import { useEditorStore } from '~/composables/editor'
import { useContextBar } from '~/composables/useContextBar'

const dmp = new DMP()
const route = useRoute()
const editor = useEditorStore()
const kc = useKeycloak()

const buttons = computed<ContextBarButtons[]>(() => [])
useContextBar(buttons)

const { m, p1, p2, v1, v2 } = route.query

enum DiffType {
  onlyLeft = -1,
  bothSides = 0,
  onlyRight = 1,
}

type DmpDiff = [DiffType, number[]]

const paths = [
  `/api/machine/${m}/program/${p1}`,
  `/api/machine/${m}/program/${p2}`,
]

let isValid1 = false
let isValid2 = false

if (v1 && v2) {
  paths[0] += `/version/${v1}`
  paths[1] += `/version/${v2}`

  const versions = await kc.fetch<ProgramHeaderArchive[]>(`/api/machine/${m}/program/${p1}/version`)
  const lastVersion = versions.at(-1)?.version

  if (lastVersion === Number(v1)) {
    isValid1 = true
  } else if (lastVersion === Number(v2)) {
    isValid2 = true
  }
} else {
  isValid1 = true
  isValid2 = true
}

const loading = ref(true)
editor.fetchMachine(Number(m)).then(() => {
  loading.value = false
}).catch((err) => {
  console.error(`Failed to load machine data for machine '${m}'`, err)
  navigateTo('/')
})

const programOneData = await kc.fetch<Program>(paths[0])
const programTwoData = await kc.fetch<Program>(paths[1])

const programOneCommands = programOneData.steps.map(step => step.mainCommand.commandNo)
const programTwoCommands = programTwoData.steps.map(step => step.mainCommand.commandNo)

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// turning normal to utf8 and using diff func
const dmpDiffsRaw = dmp.diff_main(
  decoder.decode(new Uint8Array(programOneCommands)),
  decoder.decode(new Uint8Array(programTwoCommands)),
)

// turning utf8 to normal
const dmpDiffs = dmpDiffsRaw.map((value) => {
  return [value[0], [...encoder.encode(value[1])]]
}) as DmpDiff[]

const diffResults: Array<[ProgramStepCommandDiff | null, ProgramStepCommandDiff | null]> = []

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

function processDmpDiffs(): void {
  let leftIndex = 0
  let rightIndex = 0

  for (const [diffType, diffValue] of dmpDiffs) {
    if (diffType === DiffType.bothSides) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const left = createProgramStepCommandDiff(programOneData.steps[leftIndex])
        const right = createProgramStepCommandDiff(programTwoData.steps[rightIndex])

        compareCommands(left, right)
        diffResults.push([left, right])
        leftIndex++
        rightIndex++
      }
    } else if (diffType === DiffType.onlyLeft) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const left = createProgramStepCommandDiff(programOneData.steps[leftIndex])
        left.mainCommand.diff = true
        diffResults.push([left, null])
        leftIndex++
      }
    } else if (diffType === DiffType.onlyRight) {
      const steps = diffValue.toString().split(',').length
      for (let i = 0; i < steps; i++) {
        const right = createProgramStepCommandDiff(programTwoData.steps[rightIndex])
        right.mainCommand.diff = true
        diffResults.push([null, right])
        rightIndex++
      }
    }
  }
}

processDmpDiffs()

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
</script>

<template>
  <div>
    <div v-if="loading" class="spinner-container">
      <LoadingSpinner />
    </div>
    <div v-else>
      <Main
        :diff-results="diffResults"
        :program-one-header="programOneHeader"
        :program-two-header="programTwoHeader"
      />
    </div>
  </div>
</template>

<style lang="postcss">

</style>
