import { machineStore } from '~/server/classes/MachineStore'
import { PError, isPError } from '~/server/error'

export default defineEventHandler(async (event) => {
  try {
    const { machine_id } = getRouterParams(event)
    const machineId = Number.parseInt(machine_id)

    const body = await readBody(event)
    const programNos = body?.programNos as number[]

    if (!machineId) {
      throw new PError('INVALID_MACHINE_NUMBER', { machineId })
    }

    if (!programNos || !Array.isArray(programNos) || programNos.length === 0) {
      throw new PError('INVALID_PROGRAM_NUMBERS', { machineId, programNos })
    }

    const machine = await machineStore.get(machineId)
    if (!machine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId })
    }

    const programs = await machine.fetchPrograms(programNos)

    return programs
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
      data: String(error),
    })
  }
})
