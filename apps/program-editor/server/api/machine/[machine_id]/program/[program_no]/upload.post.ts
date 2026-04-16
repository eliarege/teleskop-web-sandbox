import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import { useLogger } from '~/server/logger'
import { ProgramStatus } from '~/shared/constants'

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    const log = useLogger(event)
    try {
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

      const { program, programError } = await machine.fetchProgram(programNo)

      if (programError.steps.length > 0) {
        throw new PError('PROGRAM_HAS_ERRORS', { machineId, programNo })
      }

      log.info('Uploading program %d of machine %d.', programNo, machineId)

      const isUploaded = await machine.uploadProgram(program)
      if (isUploaded) {
        program.isChanged = false
        program.prgState = ProgramStatus.EXISTS_ON_BOTH
        program.updatedAtTBB = program.updatedAt
        await machine.updateProgramHeader(program)
        log.info('Program %d uploaded and header updated for machine %d.', programNo, machineId)
      }

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
  },
})
