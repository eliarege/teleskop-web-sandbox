import type { Knex } from 'knex'
import { updateBatch } from '@teleskop/utils'
import { fetchTeleskopSettings } from '../functions'
import { fetchAllMachines } from './machine'
import { fetchAllPrograms } from './program'
import type { Machine, MachineCommand } from '~/shared/types'
import { calculateProgramDuration } from '~/shared/formula'
import logger from '../logger'

interface RecalculateSkipped {
  machineId: number
  programNo: number
  reason: string
}

interface RecalculateError {
  machineId: number
  programNo: number
  message: string
}

export interface RecalculateResult {
  total: number
  updated: number
  skipped: RecalculateSkipped[]
  errors: RecalculateError[]
}

/**
 * Tüm programların teorik sürelerini yeniden hesaplar ve veritabanındaki
 * `BFMASTERPRGHEADER.DURATION` ile her adımın `BFMASTERSTEPS.THEORETICDURATION`
 * değerlerini günceller.
 *
 * @param db - Knex instance
 * @returns {Promise<RecalculateResult>} Özet rapor
 */
export async function recalculateAllProgramDurations(db: Knex): Promise<RecalculateResult> {
  logger.info('Recalculating all program durations... This may take a while.')
  const start = Date.now()
  const machines = await fetchAllMachines(db)
  const machineMap = new Map<number, Machine>()
  for (const m of machines) {
    machineMap.set(m.id, m)
  }

  const { initialTemperature } = await fetchTeleskopSettings()

  const programs = await fetchAllPrograms(db, machines)

  const skipped: RecalculateSkipped[] = []
  const errors: RecalculateError[] = []

  const headerUpdates: { MACHINEID: number, PROGNO: number, DURATION: number }[] = []
  const stepUpdates: { MACHINEID: number, PROGNO: number, MAINSTEP: number, PARALELSTEP: number, THEORETICDURATION: number }[] = []

  for (const program of programs) {
    const machine = machineMap.get(program.machineId)
    if (!machine) {
      skipped.push({ machineId: program.machineId, programNo: program.programNo, reason: 'MACHINE_NOT_FOUND' })
      continue
    }

    let result
    try {
      result = calculateProgramDuration(program, machine, initialTemperature)
    } catch (err) {
      errors.push({
        machineId: program.machineId,
        programNo: program.programNo,
        message: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    headerUpdates.push({
      MACHINEID: program.machineId,
      PROGNO: program.programNo,
      DURATION: result.duration,
    })

    const stepDurations = new Map<number, number>()
    for (const phase of result.stepDuration) {
      stepDurations.set(phase.stepIndex, (stepDurations.get(phase.stepIndex) ?? 0) + phase.duration)
    }

    for (const [mainStep, duration] of stepDurations) {
      stepUpdates.push({
        MACHINEID: program.machineId,
        PROGNO: program.programNo,
        MAINSTEP: mainStep,
        PARALELSTEP: 0,
        THEORETICDURATION: duration,
      })
    }
  }
  await db.transaction(async (trx) => {
    for (const header of headerUpdates) {
      await trx('BFMASTERPRGHEADER')
        .where({
          MACHINEID: header.MACHINEID,
          PROGNO: header.PROGNO,
        })
        .update({ DURATION: header.DURATION })
    }
    for (const step of stepUpdates) {
      await trx('BFMASTERSTEPS')
        .where({
          MACHINEID: step.MACHINEID,
          PROGNO: step.PROGNO,
          MAINSTEP: step.MAINSTEP,
          PARALELSTEP: step.PARALELSTEP,
        })
        .update({ THEORETICDURATION: step.THEORETICDURATION })
    }
  })
  const duration = Date.now() - start
  const summary: RecalculateResult = {
    total: programs.length,
    updated: headerUpdates.length,
    skipped,
    errors,
  }
  logger.info({ duration: `${(duration / 1000).toFixed(2)}s`, summary }, 'Recalculated program durations')
  return summary
}
