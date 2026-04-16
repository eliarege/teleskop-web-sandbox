import { machineStore } from '~/server/classes/MachineStore'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { PError } from '~/server/error'
import { logEditorOperation } from '~/server/functions'
import { useLogger } from '~/server/logger'
import type { BulkDeletionResponse, ProgramDeletionSource } from '~/shared/types'

export default defineAuthEventHandler(async (event): Promise<BulkDeletionResponse> => {
  checkPermission(event, 'program-delete')
  const log = useLogger(event)

  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }
  const body = await readBody(event)
  const programs: { programNo: number, programName: string }[] = body.programs
  const source: ProgramDeletionSource = body.source || 'both'

  if (!Array.isArray(programs) || programs.length === 0 || programs.some(p => !Number.isInteger(p.programNo))) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  const shouldDeleteFromMachine = source === 'machine' || source === 'both'
  const shouldDeleteFromDb = source === 'db' || source === 'both'

  // Makine bağlantısı kontrolü
  let machineStatus = false
  if (shouldDeleteFromMachine) {
    try {
      machineStatus = await machine.getMachineStatus()
    } catch (error) {
      machineStatus = false
    }

    if (source === 'machine' && !machineStatus) {
      throw new PError('MACHINE_OFFLINE', { machineId })
    }

    if (!machineStatus) {
      log.warn({ machineId }, 'Machine is offline, will only delete from database')
    }
  }

  // Veritabanından toplu silme
  let dbDeleted = false
  if (shouldDeleteFromDb) {
    try {
      const programNos = programs.map(p => p.programNo)
      dbDeleted = await machine.deleteProgramFromDatabase(programNos)

      if (dbDeleted) {
        for (const { programNo } of programs) {
          await logEditorOperation(
            ProgramEditorActivityCodes.PROGRAMDELETED,
            `Makine ${machineId}`,
            `Program No ${programNo}`,
          )
        }
      }
    } catch (error) {
      log.error({ err: error, machineId }, 'Error deleting programs from database')
    }
  }

  // Makineden silme ve sonuçları toplama
  const results: BulkDeletionResponse['results'] = []
  for (const { programNo, programName } of programs) {
    let machineDeleted = false

    if (shouldDeleteFromMachine && machineStatus) {
      try {
        await machine.deleteRemoteProgram(programNo)
        machineDeleted = true
      } catch (error) {
        log.error({ err: error, machineId, programNo }, 'Failed to delete program from machine')
      }
    }

    const success = shouldDeleteFromDb && shouldDeleteFromMachine
      ? dbDeleted && machineDeleted
      : shouldDeleteFromDb ? dbDeleted : machineDeleted

    results.push({
      programNo,
      programName,
      success,
      deletedFromDb: shouldDeleteFromDb && dbDeleted,
      deletedFromMachine: shouldDeleteFromMachine && machineDeleted,
      error: success ? undefined : 'Deletion failed',
    })
  }

  const totalSuccess = results.filter(r => r.success).length
  const totalFailed = results.filter(r => !r.success).length

  log.info(
    { machineId, source, totalSuccess, totalFailed, total: programs.length },
    'Bulk deleted programs from machine',
  )

  return {
    machineId,
    source,
    totalRequested: programs.length,
    totalSuccess,
    totalFailed,
    results,
  }
})
