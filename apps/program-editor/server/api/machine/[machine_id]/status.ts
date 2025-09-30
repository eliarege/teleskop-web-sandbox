import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import { getMachineStatus } from '~/server/functions'

export default defineAuthEventHandler({
  roles: ['machine-upload'],
  handler: async (event) => {
    try {
      const { machine_id } = getRouterParams(event)
      const machineId = Number(machine_id)

      if (!Number.isInteger(machineId)) {
        throw new PError('INVALID_MACHINE_OR_PROGRAM_NUMBER', { machineId, programNo: 0 })
      }

      const machine = await machineStore.get(machineId)
      if (!machine) {
        throw new PError('MACHINE_NOT_FOUND', { machineId })
      }

      const status = await getMachineStatus(machineId)
      return status
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
