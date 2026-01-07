import { machineStore } from '~/server/classes/MachineStore'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)

  if (!Number.isInteger(machineId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid machine ID',
    })
  }

  try {
    const machine = await machineStore.get(machineId)
    if (!machine) {
      return false
    }

    return await machine.getMachineStatus()
  } catch (error) {
    logger.error(`Machine ${machineId} status check failed`)
    return false
  }
})
