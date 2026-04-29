import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { machineId, commandNo } = body as { machineId: number, commandNo: number }

    if (!machineId || !commandNo) {
      throw new PError('INVALID_PARAMS', { machineId, commandNo })
    }

    const machine = await machineStore.get(machineId)
    if (!machine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId })
    }

    const machineIds = await machine.findCompatibleMachines(machineId, commandNo)

    return { machineIds }
  } catch (error: PError | unknown) {
    if (isPError(error)) {
      throw createError({
        statusCode: 400,
        message: error.code,
        data: error.detail,
      })
    }

    logger.error('Error in compatible-machines endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'INTERNAL_SERVER_ERROR',
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
