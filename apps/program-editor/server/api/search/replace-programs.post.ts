import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'
import logger from '~/server/logger'
import type { ReplaceInProgramsParams } from '~/shared/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as ReplaceInProgramsParams

    if (!body.targets?.length) {
      throw new PError('NO_TARGETS', {})
    }
    if (!body.replaceValues?.length) {
      throw new PError('NO_REPLACE_VALUES', {})
    }

    // Group targets by machineId for efficient processing
    const targetsByMachine = new Map<number, typeof body.targets>()
    for (const target of body.targets) {
      const existing = targetsByMachine.get(target.machineId) || []
      existing.push(target)
      targetsByMachine.set(target.machineId, existing)
    }

    let totalUpdated = 0

    for (const [machineId, targets] of targetsByMachine) {
      const machine = await machineStore.get(machineId)
      if (!machine) {
        logger.warn(`Machine ${machineId} not found, skipping`)
        continue
      }

      const result = await machine.replaceInPrograms({
        targets,
        originalCommandNo: body.originalCommandNo,
        replaceValues: body.replaceValues,
      })

      totalUpdated += result.updatedCount
    }

    return {
      success: true,
      operation: 'replace',
      updatedCount: totalUpdated,
    }
  } catch (error: PError | unknown) {
    if (isPError(error)) {
      throw createError({
        statusCode: 400,
        message: error.code,
        data: error.detail,
      })
    }

    logger.error('Error in replace-programs endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'INTERNAL_SERVER_ERROR',
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
