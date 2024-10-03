<script setup lang="ts">
import DMP from 'diff-match-patch'
import type { Program } from '~/shared/types'
import { useEditorStore } from '~/composables/editor'

const dmp = new DMP()
const route = useRoute()
const { m, p1, p2, v1, v2 } = route.query

const paths = [
  `/api/machine/${m}/program/${p1}`,
  `/api/machine/${m}/program/${p2}`,
]
if (v1 && v2) {
  paths[0] += `/archive/${v1}`
  paths[1] += `/archive/${v2}`
}
const editor = useEditorStore()
await editor.fetchMachine(Number(m))
const programOneData: Program = await $fetch(paths[0])
const programTwoData: Program = await $fetch(paths[1])

const programOneCommands = [] as number[]
const programTwoCommands = [] as number[]
programOneData!.steps.forEach((step) => {
  programOneCommands.push(step.mainCommand.commandNo)
})

programTwoData!.steps.forEach((step) => {
  programTwoCommands.push(step.mainCommand.commandNo)
})

// turning normal to utf8
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const a = new Uint8Array(programOneCommands)
const b = new Uint8Array(programTwoCommands)

// using diff func
const mainResult = dmp.diff_main(
  decoder.decode(a),
  decoder.decode(b),
)

// turning utf8 to normal
mainResult.forEach((value) => {
  value[1] = [...encoder.encode(value[1])]
})

const resultArray: [any, any][] = []

// Her bir `commandNo` için sayacın tutulduğu bir obje
const commandCountersOne: Record<number, number> = {}
const commandCountersTwo: Record<number, number> = {}

// Belirli bir `commandNo`'ya göre adım bilgisini almak için kullanılan fonksiyon
function getCommandDetailsWithCount(programData: Program, commandNo: number, count: number) {
  let matchCount = 0
  for (const step of programData.steps) {
    if (step.mainCommand.commandNo === commandNo) {
      if (matchCount === count) {
        return step
      }
      matchCount++
    }
  }
  return null
}

mainResult.forEach(([indicator, values]) => {
  values.forEach((commandNo) => {
    if (indicator === -1) {
      commandCountersOne[commandNo] = (commandCountersOne[commandNo] || 0) + 1
      const commandDetailsOne = getCommandDetailsWithCount(
        programOneData,
        commandNo,
        commandCountersOne[commandNo] - 1,
      )
      resultArray.push([commandDetailsOne, null])
    } else if (indicator === 1) {
      commandCountersTwo[commandNo] = (commandCountersTwo[commandNo] || 0) + 1
      const commandDetailsTwo = getCommandDetailsWithCount(
        programTwoData,
        commandNo,
        commandCountersTwo[commandNo] - 1,
      )
      resultArray.push([null, commandDetailsTwo])
    } else if (indicator === 0) {
      commandCountersOne[commandNo] = (commandCountersOne[commandNo] || 0) + 1
      const commandDetailsOne = getCommandDetailsWithCount(
        programOneData,
        commandNo,
        commandCountersOne[commandNo] - 1,
      )
      commandCountersTwo[commandNo] = (commandCountersTwo[commandNo] || 0) + 1
      const commandDetailsTwo = getCommandDetailsWithCount(
        programTwoData,
        commandNo,
        commandCountersTwo[commandNo] - 1,
      )

      resultArray.push([commandDetailsOne, commandDetailsTwo])
    }
  })
})

const parallelDifferences: Array<ParallelObject> = []
interface ParallelObject {
  onlyLeft: []
  onlyRight: []
  intersection: []
}
const mainParametersDifferences: Array<MainParametersObject> = []

interface MainParametersObject {
  leftDifferentValues: []
  rightDifferentValues: []
  sameValues: []
}

resultArray.forEach(([commandDetailsOne, commandDetailsTwo]) => {
  const parallelSorting: ParallelObject = {
    onlyLeft: [],
    onlyRight: [],
    intersection: [],
  }

  const mainParametersSorting: MainParametersObject = {
    leftDifferentValues: [],
    rightDifferentValues: [],
    sameValues: [],
  }

  if (commandDetailsOne && commandDetailsTwo) {
    // comparison of parallel comands
    const parallelCommandsOne = [...commandDetailsOne.parallelCommands]
    const parallelCommandsTwo = [...commandDetailsTwo.parallelCommands]

    while (parallelCommandsOne.length && parallelCommandsTwo.length) {
      const hasMatch = parallelCommandsTwo.some(cmd => cmd.commandNo === parallelCommandsOne[0].commandNo)

      if (hasMatch) {
        const shiftVar = parallelCommandsOne.shift()
        const parallel2Command = parallelCommandsTwo.find(cmd => cmd.commandNo === shiftVar.commandNo)
        parallelSorting.intersection.push([shiftVar, parallel2Command])
        parallelCommandsTwo.splice(parallelCommandsTwo.findIndex(cmd => cmd.commandNo === shiftVar.commandNo), 1)
      } else {
        parallelSorting.onlyLeft.push(parallelCommandsOne.shift())
      }
    }

    parallelSorting.onlyRight.push(...parallelCommandsTwo)

    parallelDifferences.push(parallelSorting)

    // comparison of main parameters
    const mainParamsOne = commandDetailsOne.mainCommand.parameters
    const mainParamsTwo = commandDetailsTwo.mainCommand.parameters

    const mainParametersSorting: MainParametersObject = {
      leftDifferentValues: [],
      rightDifferentValues: [],
      sameValues: [],
    }

    while (mainParamsOne.length > 0 || mainParamsTwo.length > 0) {
      const paramOne = mainParamsOne[0]
      const paramTwo = mainParamsTwo[0]

      if (!paramOne) {
        mainParametersSorting.rightDifferentValues.push(mainParamsTwo.shift()!)
      } else if (!paramTwo) {
        mainParametersSorting.leftDifferentValues.push(mainParamsOne.shift()!)
      } else if (paramOne.index === paramTwo.index) {
        if (paramOne.value === paramTwo.value) {
          mainParametersSorting.sameValues.push(mainParamsOne.shift()!)
          mainParamsTwo.shift()
        } else {
          mainParametersSorting.leftDifferentValues.push(mainParamsOne.shift()!)
          mainParametersSorting.rightDifferentValues.push(mainParamsTwo.shift()!)
        }
      } else if (paramOne.index < paramTwo.index) {
        mainParametersSorting.leftDifferentValues.push(mainParamsOne.shift()!)
      } else {
        mainParametersSorting.rightDifferentValues.push(mainParamsTwo.shift()!)
      }
    }

    mainParametersDifferences.push(mainParametersSorting)
  }
})

console.log('Main Command Result: ', resultArray)
console.log('Parallel Differences:', parallelDifferences)
console.log('Main Param Difference Array: ', mainParametersDifferences)
</script>

<template>
  <ComparisonTable
    :result-array="resultArray"
    :parallel-differences="parallelDifferences"
    :main-parameters-differences="mainParametersDifferences"
    :first-program="Number(p1)"
    :first-version="Number(v1)"
    :second-program="Number(p2)"
    :second-version="Number(v2)"
    :machine="Number(m)"
  />
</template>

<style lang="postcss">

</style>
