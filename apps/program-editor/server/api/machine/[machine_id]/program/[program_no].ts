import { machineStore } from '~/server/classes/MachineStore'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { PError, isPError } from '~/server/error'
import { logEditorOperation } from '~/server/functions'
import logger from '~/server/logger'
import { ProgramStatus } from '~/shared/constants'
import { checkPermission } from '~/server/utils/auth'
import type { MachineController } from '~/server/classes/MachineController'
import type { Program } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number(machine_id)
  const programNo = Number(program_no)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  if (!Number.isInteger(programNo)) {
    throw new PError('INVALID_PROGRAM_NUMBER', { machineId, programNo })
  }

  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const query = getQuery(event)

  if (event.method === 'GET') {
    logger.info(`User: ${event.context.kauth?.name}. Fetching program ${programNo}.`)
    checkPermission(event, 'program-view')
    try {
      const { program, programError } = await machine.fetchProgram(programNo)
      program.author = event.context.kauth?.name || ''

      return { program, programError }
    } catch (error) {
      if (isPError(error)) {
        throw createError({
          statusCode: 400,
          message: error.code,
          data: error.detail,
        })
      }

      throw createError({
        statusCode: 500,
        message: 'INTERNAL_SERVER_ERROR',
      })
    }
  }

  if (event.method === 'DELETE') {
    checkPermission(event, 'program-delete')
    try {
      return await handleProgramDeletion(machine, programNo, query, machineId, event.context?.kauth?.name)
    } catch (error) {
      if (isPError(error)) {
        throw createError({
          statusCode: 400,
          message: error.code,
          data: error.detail,
        })
      }

      throw createError({
        statusCode: 500,
        message: 'INTERNAL_SERVER_ERROR',
      })
    }
  }

  if (event.method === 'PUT') {
    checkPermission(event, 'program-edit')
    const body = await readBody<{ program: Program, isNewVersion: boolean }>(event)

    try {
      const { program, isNewVersion } = body
      return await machine.updateProgram(program, isNewVersion)
    } catch (error) {
      if (isPError(error)) {
        throw createError({
          statusCode: 400,
          message: error.code,
          data: error.detail,
        })
      }

      throw createError({
        statusCode: 500,
        message: 'INTERNAL_SERVER_ERROR',
      })
    }
  }

  throw createError({ statusCode: 405, statusMessage: `Method ${event.method} not allowed.` })
})

// Helper Functions

async function handleProgramDeletion(
  machine: MachineController,
  programNo: number,
  query: any,
  machineId: number,
  userName?: string,
): Promise<boolean> {
  if (!query?.source) {
    return false
  }

  const { program: { prgState } } = await machine.fetchProgram(programNo)
  const source = query.source.toString()

  if (source.includes('machine')) {
    await deleteFromMachineIfValid(machine, programNo, prgState, machineId, userName)
  }

  if (source.includes('db')) {
    return await deleteFromDatabaseIfValid(machine, programNo, prgState, machineId, userName)
  }

  return true
}

async function deleteFromMachineIfValid(machine: MachineController, programNo: number, prgState: number | null, machineId: number, userName?: string) {
  if (
    prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER
    || prgState === ProgramStatus.EXISTS_ON_BOTH
  ) {
    logger.info(`User: ${userName}. Deleted program ${programNo} from machine ${machineId}.`)
    await machine.deleteRemoteProgram(programNo)

    if (prgState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
      await machine.deleteProgramFromDatabase(programNo)
    }
  }
}

async function deleteFromDatabaseIfValid(
  machine: MachineController,
  programNo: number,
  prgState: number | null,
  machineId: number,
  userName?: string,
): Promise<boolean> {
  if (
    prgState === ProgramStatus.EXISTS_ONLY_ON_DATABASE
    || prgState === ProgramStatus.EXISTS_ON_BOTH
  ) {
    logger.info(`User: ${userName}. Deleted program ${programNo} from database for machine ${machineId}.`)
    await logEditorOperation(
      ProgramEditorActivityCodes.PROGRAMDELETED,
      `Machine ${machineId}`,
      `Program No ${programNo}`,
    )

    return await machine.deleteProgramFromDatabase(programNo)
  }
  return false
}
