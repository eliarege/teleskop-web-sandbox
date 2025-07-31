import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    try {
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

      const { program, programErrors } = await machine.fetchProgram(programNo)
      if (!program) {
        throw new PError('PROGRAM_NOT_FOUND', { machineId, programNo })
      }

      if (programErrors.length) {
        throw new PError('PROGRAM_HAS_ERRORS', { machineId, programNo })
      }

      logger.info(`User: ${event.context.kauth?.name}. Uploading program ${programNo} of machine ${machineId}.`)

      return await machine.uploadProgram(program)
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
  },
})
