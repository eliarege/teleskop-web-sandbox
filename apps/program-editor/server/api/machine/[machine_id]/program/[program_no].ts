import { machineStore } from '~/server/classes/MachineStore'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { PError } from '~/server/error'
import { logEditorOperation } from '~/server/functions'
import logger from '~/server/logger'
import { ProgramStatus } from '~/shared/constants'
import { checkPermission } from '~/server/utils/auth'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)

  if (Number.isNaN(machineId) || Number.isNaN(programNo)) {
    throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo })
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
      const { program, programErrors } = await machine.fetchProgram(programNo)

      if (!program)
        throw new PError('PROGRAM_NOT_FOUND', { machineId, programNo })

      program.author = event.context.kauth?.name || ''

      return { program, programErrors }
    } catch (error) {
      if (error instanceof PError && error.code === 'PROGRAM_NOT_FOUND') {
        throw createError({
          statusCode: 404,
          data: { code: error.code, detail: error.detail },
        })
      }
      throw error
    }
  }

  if (event.method === 'DELETE') {
    checkPermission(event, 'program-delete')
    return await handleProgramDeletion(machine, programNo, query, machineId, event.context?.kauth?.name)
  }

  throw createError({ statusCode: 405, statusMessage: `Method ${event.method} not allowed.` })
})

// Helper Functions

async function handleProgramDeletion(
  machine: any,
  programNo: number,
  query: any,
  machineId: number,
  userName?: string,
) {
  if (!query?.source) {
    return 0
  }

  const { programState } = await machine.fetchProgram(programNo)
  const source = query.source.toString()

  if (source.includes('machine')) {
    await deleteFromMachineIfValid(machine, programNo, programState, machineId, userName)
  }

  if (source.includes('db')) {
    return await deleteFromDatabaseIfValid(machine, programNo, programState, machineId, userName)
  }

  return 1
}

async function deleteFromMachineIfValid(machine: any, programNo: number, programState: string, machineId: number, userName?: string) {
  if (
    programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER
    || programState === ProgramStatus.EXISTS_ON_BOTH
  ) {
    try {
      logger.info(`User: ${userName}. Deleted program ${programNo} from machine ${machineId}.`)
      await machine.deleteRemoteProgram(programNo)
    } catch (error) {
      logger.error(`Error deleting program ${programNo} from machine ${machineId}: ${error.message}`)
    }
  }
}

async function deleteFromDatabaseIfValid(
  machine: any,
  programNo: number,
  programState: string,
  machineId: number,
  userName?: string,
) {
  if (
    programState === ProgramStatus.EXISTS_ONLY_ON_DATABASE
    || programState === ProgramStatus.EXISTS_ON_BOTH
  ) {
    logger.info(`User: ${userName}. Deleted program ${programNo} from database for machine ${machineId}.`)
    await logEditorOperation(
      ProgramEditorActivityCodes.PROGRAMDELETED,
      `Machine ${machineId}`,
      `Program No ${programNo}`,
    )
    return await machine.deleteProgramFromDatabase(programNo)
  }
  return 0
}
