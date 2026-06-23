import { machineStore } from '~/server/classes/MachineStore'
import { PError } from '~/server/error'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const result = await machine.downloadAllPrograms()

  return {
    success: result.success,
    count: result.count,
    total: result.total,
    errors: result.errors,
    message: result.message,
    results: result.results,
  }
})
