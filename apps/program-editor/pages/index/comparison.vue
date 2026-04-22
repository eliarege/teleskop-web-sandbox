<script setup lang="ts">
import DMP from 'diff-match-patch'
import Main from '~/components/Comparison/Main.vue'
import type { Program, ProgramHeaderArchive, ProgramInfoHeader, ProgramStep, ProgramStepCommandDiff } from '~/shared/types'
import { useContextBar } from '~/composables/useContextBar'

enum DiffType {
  onlyLeft = -1,
  bothSides = 0,
  onlyRight = 1,
}
type DmpDiff = [DiffType, number[]]

const dmp = new DMP()
const kc = useKeycloak()
const route = useRoute()
const machine = useMachineStore()
const { notifyError } = useNotify()

useContextBar(computed(() => []))

const m = String(route.query.m)
const p1 = String(route.query.p1)
const p2 = String(route.query.p2)
const v1 = route.query.v1 ? String(route.query.v1) : null
const v2 = route.query.v2 ? String(route.query.v2) : null

const paths = [`/api/machine/${m}/program/${p1}`, `/api/machine/${m}/program/${p2}`]

let isValid1 = !v1
let isValid2 = !v2

if (v1 && v2) {
  paths[0] += `/version/${v1}`
  paths[1] += `/version/${v2}`

  const versions = await kc.fetch<ProgramHeaderArchive[]>(`/api/machine/${m}/program/${p1}/version`)
  const lastVersion = versions.at(-1)?.version

  if (lastVersion === Number(v1))
    isValid1 = true
  else if (lastVersion === Number(v2))
    isValid2 = true
}

try {
  await machine.loadMachine(Number(m))
} catch {
  notifyError('Machine could not be loaded.')
}

const [{ program: programOneData }, { program: programTwoData }] = await Promise.all([
  kc.fetch<{ program: Program }>(paths[0]),
  kc.fetch<{ program: Program }>(paths[1]),
])

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const dmpDiffs = dmp.diff_main(
  decoder.decode(new Uint8Array(programOneData.steps.map(s => s.mainCommand.commandNo))),
  decoder.decode(new Uint8Array(programTwoData.steps.map(s => s.mainCommand.commandNo))),
).map(([type, text]) => [type, [...encoder.encode(text)]] as DmpDiff)

function createStepDiff(step: ProgramStep): ProgramStepCommandDiff {
  return {
    mainCommand: {
      diff: false,
      commandNo: step.mainCommand.commandNo || 0,
      parameters: (step.mainCommand.parameters || []).map(p => ({ index: p.index, value: p.value, diff: false })),
    },
    parallelCommands: step.parallelCommands.map(cmd => ({
      commandNo: cmd.commandNo!,
      diff: false,
      parameters: (cmd.parameters || []).map(p => ({ index: p.index, value: p.value, diff: false })),
    })),
  }
}

function compareSteps(left: ProgramStepCommandDiff, right: ProgramStepCommandDiff): void {
  if (left.mainCommand.commandNo !== right.mainCommand.commandNo) {
    left.mainCommand.diff = true
    right.mainCommand.diff = true
    return
  }

  // Parameters
  const lp = [...left.mainCommand.parameters]
  const rp = [...right.mainCommand.parameters]
  while (lp.length || rp.length) {
    const l = lp[0]; const r = rp[0]
    if (!r) {
      left.mainCommand.parameters[left.mainCommand.parameters.indexOf(lp.shift()!)].diff = true
    } else if (!l) {
      right.mainCommand.parameters[right.mainCommand.parameters.indexOf(rp.shift()!)].diff = true
    } else if (l.value === r.value && l.index === r.index) {
      lp.shift(); rp.shift()
    } else {
      left.mainCommand.parameters[left.mainCommand.parameters.indexOf(lp.shift()!)].diff = true
      right.mainCommand.parameters[right.mainCommand.parameters.indexOf(rp.shift()!)].diff = true
    }
  }

  // Parallel commands
  const lc = [...left.parallelCommands]
  const rc = [...right.parallelCommands]
  while (lc.length || rc.length) {
    const lCmd = lc[0]; const rCmd = rc[0]
    if (!lCmd) {
      rc.shift()!.diff = true
    } else if (!rCmd) {
      lc.shift()!.diff = true
    } else if (lCmd.commandNo === rCmd.commandNo) {
      const lpp = [...lCmd.parameters]; const rpp = [...rCmd.parameters]
      while (lpp.length || rpp.length) {
        const lq = lpp[0]; const rq = rpp[0]
        if (!rq) {
          lCmd.parameters[lCmd.parameters.indexOf(lpp.shift()!)].diff = true
        } else if (!lq) {
          rCmd.parameters[rCmd.parameters.indexOf(rpp.shift()!)].diff = true
        } else if (lq.value === rq.value && lq.index === rq.index) {
          lpp.shift(); rpp.shift()
        } else {
          lCmd.parameters[lCmd.parameters.indexOf(lpp.shift()!)].diff = true
          rCmd.parameters[rCmd.parameters.indexOf(rpp.shift()!)].diff = true
        }
      }
      lc.shift(); rc.shift()
    } else {
      lc.shift()!.diff = true; rc.shift()!.diff = true
    }
  }
}

const diffResults: Array<[ProgramStepCommandDiff | null, ProgramStepCommandDiff | null]> = []
let leftIdx = 0; let rightIdx = 0

for (const [type, value] of dmpDiffs) {
  const count = value.toString().split(',').length
  for (let i = 0; i < count; i++) {
    if (type === DiffType.bothSides) {
      const left = createStepDiff(programOneData.steps[leftIdx])
      const right = createStepDiff(programTwoData.steps[rightIdx])
      compareSteps(left, right)
      diffResults.push([left, right])
      leftIdx++; rightIdx++
    } else if (type === DiffType.onlyLeft) {
      const left = createStepDiff(programOneData.steps[leftIdx])
      left.mainCommand.diff = true
      diffResults.push([left, null])
      leftIdx++
    } else {
      const right = createStepDiff(programTwoData.steps[rightIdx])
      right.mainCommand.diff = true
      diffResults.push([null, right])
      rightIdx++
    }
  }
}

const programOneHeader: ProgramInfoHeader = {
  programName: programOneData.name,
  programNo: programOneData.programNo,
  programVersion: v1 ? Number(v1) : null,
  stepCount: programOneData.steps.length,
  isValid: isValid1,
}

const programTwoHeader: ProgramInfoHeader = {
  programName: programTwoData.name,
  programNo: programTwoData.programNo,
  programVersion: v2 ? Number(v2) : null,
  stepCount: programTwoData.steps.length,
  isValid: isValid2,
}
</script>

<template>
  <Main
    :diff-results="diffResults"
    :program-one-header="programOneHeader"
    :program-two-header="programTwoHeader"
  />
</template>
