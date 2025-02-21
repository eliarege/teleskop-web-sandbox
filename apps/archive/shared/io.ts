import type { AnalogInputOutputType, AnalogValue, ArchivedAnalogValue, ArchivedCalculatedValue, ArchivedDigitalValue, ArchivedIoValues, ArchivedReelCycleTime, ArchivedVirtualInputValue, Batch, BatchValues, CalculatedValue, Counter, DigitalInputOutputType, DigitalValue, Reel, VirtualInput } from '~/types/archive'
import type { DuoAny, DuoParsed, DuoRaw } from '~/types/utils'
import { IOType } from '~/server/utils/constants'

interface AnalogIO {
  ioValues: DuoAny<AnalogValue>[]
}

export function insertBatchValues(batch: DuoParsed<Batch>, values: DuoParsed<BatchValues>): void
export function insertBatchValues(batch: DuoRaw<Batch>, values: DuoRaw<BatchValues>): void
export function insertBatchValues(batch: DuoAny<Batch>, values: DuoAny<BatchValues>): void {
  batch.lastRecordDate = values.lastRecordDate
  batch.alarms = values.alarms
  batch.mergedCommands = values.mergedCommands
  batch.actualCommands = values.actualCommands
  batch.interventions.push(...values.interventions)
  insertAnalogInputValues(batch.analogInputs, values.analogValues)
  insertAnalogOutputValues(batch.analogOutputs, values.analogValues)
  insertDigitalInputValues(batch.digitalInputs, values.digitalValues)
  insertDigitalOutputValues(batch.digitalOutputs, values.digitalValues)
  insertDigitalOutputLockValues(batch.digitalOutputLocks, values.digitalValues)
  insertReelCycleTimes(batch.cycleTimes, values.cycleTimes)
  insertCounterValues(batch.counters, values.analogValues)
  insertVirtualInputValues(batch.virtualInputs, values.virtualInputValues)
  insertCalculatedValues(batch.calculatedValues, values.calculatedValues)
}

export function insertAnalogInputValues(analogInputs: DuoAny<AnalogInputOutputType>[], analogValues: DuoAny<ArchivedAnalogValue>[]) {
  const analogInputMap = new Map<string, AnalogIO>(
    analogInputs.map(ai => [`${IOType.AnalogInput}-${ai.ioIndex}`, ai]),
  )

  for (const av of analogValues) {
    const io = analogInputMap.get(`${av.ioType}-${av.ioIndex}`)
    if (io) {
      io.ioValues.push({
        time: av.logtime,
        value: av.ioValue,
      })
    }
  }

  return analogInputs
}

export function insertAnalogOutputValues(analogOutputs: DuoAny<AnalogInputOutputType>[], analogValues: DuoAny<ArchivedAnalogValue>[]) {
  const analogOutputMap = new Map<string, AnalogIO>(
    analogOutputs.map(ao => [`${IOType.AnalogOutput}-${ao.ioIndex}`, ao]),
  )

  for (const av of analogValues) {
    const ao = analogOutputMap.get(`${av.ioType}-${av.ioIndex}`)
    if (ao) {
      ao.ioValues.push({
        time: av.logtime,
        value: av.ioValue,
      })
    }
  }

  return analogOutputs
}

export function insertCounterValues(counters: DuoAny<Counter>[], analogValues: DuoAny<ArchivedAnalogValue>[]) {
  const counterMap = new Map<string, AnalogIO>(
    counters.map(cnt => [`${IOType.Counter}-${cnt.ioIndex}`, cnt]),
  )

  for (const av of analogValues) {
    const io = counterMap.get(`${av.ioType}-${av.ioIndex}`)
    if (io) {
      io.ioValues.push({
        time: av.logtime,
        value: av.ioValue,
      })
    }
  }

  return counters
}

export function insertVirtualInputValues(virtualInputs: DuoAny<VirtualInput>[], virtualInputValues: DuoAny<ArchivedVirtualInputValue>[]) {
  const virtualInputMap = new Map<number, AnalogIO>(
    virtualInputs.map(vi => [vi.ioIndex, vi]),
  )

  for (const val of virtualInputValues) {
    const vi = virtualInputMap.get(val.ioId)
    if (vi) {
      vi.ioValues.push({
        time: val.logtime,
        value: val.ioValue,
      })
    }
  }

  return virtualInputs
}

export function insertDigitalInputValues(digitalInputs: DuoAny<DigitalInputOutputType>[], digitalValues: DuoAny<ArchivedDigitalValue>[]) {
  const binaryValues = digitalValues.map((div) => {
    return {
      DI: hexToBinary(div.DI),
      logtime: div.logtime,
    }
  })

  for (const di of digitalInputs) {
    di.ioValues.push(...filterRepeatingDigitalValues(binaryValues.map(div => ({
      time: div.logtime,
      value: div.DI.length > di.ioIndex
        ? Number(div.DI[di.ioIndex])
        : 0,
    }))))
  }

  return digitalInputs
}

export function insertDigitalOutputValues(digitalOutputs: DuoAny<DigitalInputOutputType>[], digitalValues: DuoAny<ArchivedDigitalValue>[]) {
  const binaryValues = digitalValues.map((div) => {
    return {
      DOF: hexToBinary(div.DOF),
      logtime: div.logtime,
    }
  })

  for (const dof of digitalOutputs) {
    dof.ioValues.push(...filterRepeatingDigitalValues(binaryValues.map(div => ({
      time: div.logtime,
      value: div.DOF.length > dof.ioIndex
        ? Number(div.DOF[dof.ioIndex])
        : 0,
    }))))
  }

  return digitalOutputs
}

export function insertDigitalOutputLockValues(digitalOutputLocks: DuoAny<DigitalInputOutputType>[], digitalValues: DuoAny<ArchivedDigitalValue>[]) {
  const binaryValues = digitalValues.map((div) => {
    return {
      DOL: hexToBinary(div.DOL),
      logtime: div.logtime,
    }
  })

  for (const dol of digitalOutputLocks) {
    dol.ioValues.push(...filterRepeatingDigitalValues(binaryValues.map(div => ({
      time: div.logtime,
      value: div.DOL.length > dol.ioIndex
        ? Number(div.DOL[dol.ioIndex])
        : 0,
    }))))
  }

  return digitalOutputLocks
}

export function insertReelCycleTimes(reels: DuoAny<Reel>[], cycles: DuoAny<ArchivedReelCycleTime>[]) {
  const reelMap = new Map<number, DuoAny<Reel>>(
    reels.map(r => [r.reelNo, r]),
  )
  for (const cycle of cycles) {
    const reel = reelMap.get(cycle.reelNo)
    if (reel) {
      reel.cycles.push({
        count: cycle.cycleCount,
        duration: cycle.cycleTime,
        cycledAt: cycle.cycleDate,
      })
    }
  }

  return reels
}

/**
 * Dijital değerlerin bulunduğu array'de tekrarlayan değerleri kaldırır.
 */
function filterRepeatingDigitalValues(values: DuoAny<DigitalValue>[]): DuoAny<DigitalValue>[] {
  // return values
  return values.reduce((acc, curr) => {
    const prev = acc[acc.length - 1]
    if (!prev || prev.value !== curr.value) {
      acc.push(curr)
    }
    return acc
  }, [] as DuoAny<DigitalValue>[])
}

function hexToBinary(hexValue: string): string {
  let binaryResult = ''

  for (let i = 0; i < hexValue.length; i++) {
    const decimal = Number.parseInt(hexValue.charAt(i), 16)
    const binary = decimal.toString(2).padStart(4, '0')
    binaryResult += binary
  }

  return binaryResult
}

export function insertCalculatedValues(calculatedValues: DuoAny<CalculatedValue>[], archiveCalculatedValues: DuoAny<ArchivedCalculatedValue>[]) {
  for (const acv of archiveCalculatedValues) {
    calculatedValues[acv.valueId].ioValues.push({
      time: acv.logtime,
      value: acv.value,
      valueId: acv.valueId,
    })
  }
}
