import { machineStore } from '~/server/classes/MachineStore'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { PError } from '~/server/error'
import { logEditorOperation } from '~/server/functions'
import logger from '~/server/logger'
import type { BulkDeletionResponse, ProgramDeletionSource } from '~/shared/types'

export default defineAuthEventHandler(async (event): Promise<BulkDeletionResponse> => {
  checkPermission(event, 'program-delete')

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

  const userName = event.context?.kauth?.name
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
      logger.warn(`Machine ${machineId} is offline, will only delete from database`)
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
      logger.error(`Error deleting programs from database for machine ${machineId}:`, error)
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
        logger.error(`Failed to delete program ${programNo} from machine ${machineId}:`, error)
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

  logger.info(
    `User: ${userName}. Bulk deleted programs from machine ${machineId}. `
    + `Success: ${totalSuccess}/${programs.length}, Failed: ${totalFailed}`,
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
