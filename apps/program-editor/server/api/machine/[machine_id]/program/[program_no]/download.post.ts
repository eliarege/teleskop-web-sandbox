import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import { ProgramStatus } from '~/shared/constants'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machine_id, program_no } = getRouterParams(event)
    const machineId = Number(machine_id)
    const programNo = Number(program_no)

    if (!Number.isInteger(machineId) || !Number.isInteger(programNo)) {
      throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo })
    }

    const machine = await machineStore.get(machineId)
    if (!machine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId })
    }

    const machineProgram = await machine.downloadProgram(programNo)
    if (!machineProgram) {
      throw new PError('PROGRAM_FAILED_TO_DOWNLOAD', { machineId, programNo })
    }

    const programHeader = await machine.fetchProgramHeader(machineId, programNo)
    if (!programHeader) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId, programNo })
    }

    const updatedAt = machineProgram.updatedAt || new Date(0)
    const updatedAtTBB = machineProgram.updatedAtTBB || new Date(0)
    const latestDate = updatedAt > updatedAtTBB ? updatedAt : updatedAtTBB

    await machine.updateProgram(machineProgram)

    machineProgram.updatedAt = latestDate
    machineProgram.updatedAtTBB = latestDate
    machineProgram.prgState = ProgramStatus.EXISTS_ON_BOTH
    machineProgram.isChanged = false

    await machine.updateProgramHeader(machineProgram)
    return true
  } catch (error: PError | unknown) {
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
})
