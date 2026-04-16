import { inferBoolean } from '@teleskop/utils'
import { machineStore } from '~/server/classes/MachineStore'
import { PError } from '~/server/error'
import logger from '~/server/logger'

export default defineAuthEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number(machine_id)

  if (!Number.isInteger(machineId)) {
    throw new PError('INVALID_MACHINE_NUMBER', { machineId })
  }

  const query = getQuery(event)
  const machine = await machineStore.get(machineId)
  if (!machine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId })
  }

  const editable = inferBoolean(query.editable as string, false)
  const machineInfo = await machine.getMachineInfo(editable)
  logger.debug(`Fetched info of machine ${machineId}`)

  return machineInfo
})
