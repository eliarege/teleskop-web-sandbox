import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'
import type { FindInProgramsParams } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const searchParams: FindInProgramsParams = body.searchParams

    const machine = await machineStore.get(searchParams.machineIds[0])
    if (!machine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId: searchParams.machineIds[0] })
    }

    const results = await machine.findInPrograms(searchParams)

    return results
  } catch (error: PError | unknown) {
    if (isPError(error)) {
      throw createError({
        statusCode: 400,
        message: error.code,
        data: error.detail,
      })
    }

    logger.error('Error in find-programs endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'INTERNAL_SERVER_ERROR',
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
